import torch
import torch.nn as nn
import torch.nn.functional as F


SR=16000
MAX_LEN=80000 # 5 seconds
BATCH_SIZE=16

N_FFT=512
HOP_LENGTH=160
CENTER=False
FREQ_BINS=256

DETACH_EVERY=20
REAL_TIME_CHUNK_FRAMES=4


def make_group_norm(channels,max_groups=8):
    pass

class SEBlock(nn.Module): # attention layer
    pass

class ResSEBlock(nn.Module):
    pass

def up_Block(in_c,out_c):
    pass

class Model (nn.Module):
    pass

class SpectrogramTransform:
    def __init__(self,n_fft=N_FFT,hop_length=HOP_LENGTH,center=CENTER,device='cpu'):

        self.n_fft=n_fft
        self.hop_length=hop_length
        self.center=center
        self.device=device

        self.window=torch.hamming_window(self.n_fft).to(self.device)

    def pad_for_center_false(self,wav):
        if self.center:
            return wav

        total_len=wav.shape[-1]
        if total_len<self.n_fft:
            pad_amount=self.n_fft-total_len
        else :
            remainder=(total_len-self.n_fft)%self.hop_length
            pad_amount=0 if remainder==0  else self.hop_length-remainder

        if pad_amount>0:
            wav=F.pad(wav,(0,pad_amount))

        return wav

    def audio_to_spectrogram(self,wav):

        if self.window.device!=wav.device:
            self.window=self.window.to(wav.device)

        wav = self.pad_for_center_false(wav)
        spec=torch.stft(
            wav,n_fft=self.n_fft,hop_length=self.hop_length,
            window=self.window,return_complex=True,center=self.center
        )
        spec_features=torch.view_as_real(spec).permute(0,3,1,2)
        spec_features=spec_features[:,:,:-1,:]
        return spec_features

    def apply_mask(self,spec_features,mask):
        return spec_features*mask

    def spectrogram_to_audio(self,enhanced_spec,target_num_samples):
        if self.window.device !=enhanced_spec.device:
            self.window=self.window.to(enhanced_spec.device)

        enhanced_spec=F.pad(enhanced_spec,(0,0,0,1))
        enhanced_spec=enhanced_spec.permute(0,2,3,1).contiguous()

        complex_spec=torch.complex(
            enhanced_spec[...,0],
            enhanced_spec[...,1]
        )
        wav=torch.istft(
            complex_spec,
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            window=self.window,
            center=self.center,
            length=target_num_samples
        )

        return wav

def load_model(device):
    model = Model().to(device)

    state_dict = torch.load(
        "model_only.pth",  
        map_location=device
    )

    model.load_state_dict(state_dict)
    model.eval()

    return model
