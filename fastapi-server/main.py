from fastapi import FastAPI, WebSocket
import torch
import numpy as np
from fastapi import WebSocketDisconnect

from inference_model import (
    load_model,
    SpectrogramTransform,
    enhance_waveform_streaming
)

app = FastAPI()

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

model = load_model(device)

transform = SpectrogramTransform(
    n_fft=512,
    hop_length=160,
    center=False,
    device=device
)

class SessionState:
    def __init__(self):
        self.h = None

sessions = {}


def decode_audio(bytes_data):
    return np.frombuffer(
        bytes_data,
        dtype=np.float32
    )

def encode_audio(wav):
    return wav.astype(
        np.float32
    ).tobytes()

@app.websocket("/ws/audio")
async def audio_ws(websocket: WebSocket):

    await websocket.accept()

    user_id = id(websocket)

    sessions[user_id] = SessionState()
    state = sessions[user_id]

    try:
        while True:

            audio_bytes = await websocket.receive_bytes()

            wav = decode_audio(audio_bytes)

            wav = torch.tensor(
                wav,
                dtype=torch.float32
            ).unsqueeze(0).to(device)

            with torch.no_grad():

                enhanced_wav, _, state.h = (
                    enhance_waveform_streaming(
                        noisy_wav=wav,
                        model=model,
                        transform=transform,
                        chunk_frames=16,
                        h=state.h
                    )
                )

            output = (
                enhanced_wav
                .squeeze(0)
                .cpu()
                .numpy()
            )

            await websocket.send_bytes(
                encode_audio(output)
            )

    except WebSocketDisconnect:
        print(f"Client disconnected: {user_id}")
        sessions.pop(user_id, None)

    except Exception as e:
        print(e)
        sessions.pop(user_id, None)


@app.get("/")
def root():
    return {"status": "running"}

# uvicorn main:app --host 0.0.0.0 --port 8000