from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import torch
import numpy as np
import asyncio
import uuid

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
# SESSION STATE PER USER
# ----------------------------
class SessionState:
    def __init__(self):
        self.h = None


sessions = {}

# ----------------------------
# AUDIO HELPERS
# ----------------------------
def decode_audio(bytes_data):
    return np.frombuffer(bytes_data, dtype=np.float32)


def encode_audio(wav: np.ndarray):
    return wav.astype(np.float32).tobytes()


# ----------------------------
# FAST SAFE INFERENCE WRAPPER
# ----------------------------
async def run_inference(wav_tensor, state: SessionState):

    def _infer():
        with torch.inference_mode():

            noisy_spec = transform.audio_to_spectrogram(
                wav_tensor
            )

            mask, new_h = model(
                noisy_spec,
                state.h
            )

            enhanced_spec = transform.apply_mask(
                noisy_spec,
                mask
            )

            enhanced_wav = transform.spectrogram_to_audio(
                enhanced_spec,
                target_num_samples=wav_tensor.shape[-1]
            )

            return enhanced_wav, new_h

    enhanced_wav, new_h = await asyncio.to_thread(_infer)

    state.h = (
        new_h.detach()
        if new_h is not None
        else None
    )

    return enhanced_wav, state.h


x = 1
# ----------------------------
# WEBSOCKET ENDPOINT
# ----------------------------
@app.websocket("/ws/audio")
async def audio_ws(websocket: WebSocket):
    await websocket.accept()

    user_id = str(uuid.uuid4())
    sessions[user_id] = SessionState()
    state = sessions[user_id]

    print(f"Client connected: {user_id}")

    try:
        while True:
            # ----------------------------
            # 1. RECEIVE AUDIO
            # ----------------------------
            audio_bytes = await websocket.receive_bytes()

            wav = decode_audio(audio_bytes)
            # global x
            # print(f"{x} [RECV] user={user_id} bytes={len(audio_bytes)} samples={len(wav)}")
            # x += 1

            wav = torch.tensor(
                wav,
                dtype=torch.float32,
                device=device
            ).unsqueeze(0)

            # ----------------------------
            # 2. RUN INFERENCE (NON-BLOCKING)
            # ----------------------------
            enhanced_wav, new_h = await run_inference(wav, state)
            state.h = new_h

            # ----------------------------
            # 3. SEND RESULT
            # ----------------------------
            output = (
                enhanced_wav
                .squeeze(0)
                .detach()
                .cpu()
                .numpy()
            )
           
            input_np = wav.squeeze(0).detach().cpu().numpy()
            output_np = enhanced_wav.squeeze(0).detach().cpu().numpy()
            diff = np.mean(np.abs(input_np - output_np))
            print(f"[DIFF L1] {diff:.6f}")
            
            await websocket.send_bytes(encode_audio(output))

    except WebSocketDisconnect:
        print(f"Disconnected: {user_id}")
        sessions.pop(user_id, None)

    except Exception as e:
        print(f"Error: {e}")
        sessions.pop(user_id, None)


# ----------------------------
# HEALTH CHECK
# ----------------------------
@app.get("/")
def root():
    return {"status": "running"}

# uvicorn main:app --host 0.0.0.0 --port 8000