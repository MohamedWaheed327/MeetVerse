from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import torch
import numpy as np
import asyncio
import uuid
import os
import soundfile as sf

from inference_model import (
    load_model,
    SpectrogramTransform,
    enhance_waveform_streaming
)

app = FastAPI()

# ----------------------------
# Device + Model (GLOBAL)
# ----------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = load_model(device)

transform = SpectrogramTransform(
    n_fft=512,
    hop_length=160,
    center=False,
    device=device
)

# ----------------------------
# Recordings Directory
# ----------------------------
RECORDINGS_DIR = "recordings"
os.makedirs(RECORDINGS_DIR, exist_ok=True)

# ----------------------------
# SESSION STATE PER USER
# ----------------------------
class SessionState:
    def __init__(self):
        self.h = None

        self.queue = np.zeros(2912 * 2, dtype=np.float32)

        # raw audio received from client
        self.input_chunks = []

        # enhanced audio returned by model
        self.output_chunks = []

sessions = {}

# ----------------------------
# AUDIO HELPERS
# ----------------------------
def decode_audio(bytes_data):
    return np.frombuffer(bytes_data, dtype=np.float32)

def encode_audio(wav: np.ndarray):
    return wav.astype(np.float32).tobytes()

def save_session_audio(user_id: str, state: SessionState):
    try:
        # ----------------------------
        # SAVE INPUT
        # ----------------------------
        if state.input_chunks:
            input_audio = np.concatenate(state.input_chunks)

            input_file = os.path.join(
                RECORDINGS_DIR,
                f"{user_id}_input.wav"
            )

            sf.write(
                input_file,
                input_audio,
                16000
            )

            print(
                f"Saved input audio: {input_file}"
            )

        # ----------------------------
        # SAVE OUTPUT
        # ----------------------------
        if state.output_chunks:

            output_audio = np.concatenate(
                state.output_chunks
            )

            output_file = os.path.join(
                RECORDINGS_DIR,
                f"{user_id}_output.wav"
            )

            sf.write(
                output_file,
                output_audio,
                16000
            )

            print(
                f"Saved output audio: {output_file}"
            )

    except Exception as e:
        print(
            f"Failed saving audio for {user_id}: {e}"
        )

# ----------------------------
# FAST SAFE INFERENCE WRAPPER
# ----------------------------
async def run_inference(wav_tensor,state: SessionState):
    def _infer():
        with torch.inference_mode():
            noisy_spec = transform.audio_to_spectrogram(wav_tensor) # STFT

            mask, new_h = model(noisy_spec, state.h)

            enhanced_spec = transform.apply_mask(noisy_spec, mask)

            # enhanced_spec = noisy_spec
            # new_h = state.h

            enhanced_wav = transform.spectrogram_to_audio(enhanced_spec, target_num_samples=wav_tensor.shape[-1]) # ISTFT

            return enhanced_wav, new_h

    enhanced_wav, new_h = await asyncio.to_thread(_infer)

    state.h = new_h.detach() if new_h is not None else None
    return enhanced_wav, state.h


# ----------------------------
# WEBSOCKET ENDPOINT
# ----------------------------
@app.websocket("/ws/audio")
async def audio_ws(websocket: WebSocket):
    await websocket.accept()

    user_id = str(uuid.uuid4())
    sessions[user_id] = SessionState()
    state = sessions[user_id]

    print(f"Client connected: {user_id}" )

    try:
        while True:
            # ----------------------------
            # RECEIVE AUDIO
            # ----------------------------
            audio_bytes = await websocket.receive_bytes()

            wav = decode_audio(audio_bytes) # 160 sample
            
            # print(len(audio_bytes), wav.shape)
            # state.queue = np.concatenate([state.queue[len(wav):], wav])
            # wav = np.asarray(state.queue, dtype=np.float32)

            # Save incoming audio
            state.input_chunks.append(wav.copy())

            wav = torch.tensor(
                wav,
                dtype=torch.float32,
                device=device
            ).unsqueeze(0)

            # ----------------------------
            # INFERENCE
            # ----------------------------
            enhanced_wav, new_h = (await run_inference(wav,state))
            state.h = new_h

            # ----------------------------
            # CONVERT OUTPUT
            # ----------------------------
            output = enhanced_wav.squeeze(0).detach().cpu().numpy()
            # output = output[-160:]

            # Save enhanced audio
            state.output_chunks.append(output.copy())

            # ----------------------------
            # SEND RESULT
            # ----------------------------
            await websocket.send_bytes(encode_audio(output))

    except WebSocketDisconnect:
        print(f"Disconnected: {user_id}")
        save_session_audio(user_id, state)
        sessions.pop(user_id, None)

    except Exception as e:
        print(f"Error: {e}")
        save_session_audio(user_id, state)
        sessions.pop(user_id, None)

# ----------------------------
# HEALTH CHECK
# ----------------------------
@app.get("/")
def root():
    return {"status": "running"}

# Run:
# uvicorn main:app --host 0.0.0.0 --port 8000