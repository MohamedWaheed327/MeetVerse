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
    """
    Runs torch inference in a background thread
    so WebSocket event loop is NEVER blocked.
    """

    def _infer():
        with torch.no_grad():
            return enhance_waveform_streaming(
                noisy_wav=wav_tensor,
                model=model,
                transform=transform,
                chunk_frames=16,
                h=state.h
            )

    enhanced_wav, _, new_h = await asyncio.to_thread(_infer)
    return enhanced_wav, new_h


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