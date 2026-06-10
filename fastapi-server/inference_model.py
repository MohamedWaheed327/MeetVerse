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
TRAIN_CHUNK_FRAMES=16
VAL_CHUNK_FRAMES=16
train_chunk_frame_choices=[8,16]

ENABLE_TRANSIENT_AUG=True
TRANSIENT_PROB=0.15
TRANSIENT_MAX_EVENTS=1
TRANSIENT_SNR_RANGE=(-3,20)
TRANSIENT_LOSS_WEIGHT=0.4

NUM_WORKERS=4
PIN_MEMORY=torch.cuda.is_available()
USE_AMP=torch.cuda.is_available()

RUN_PESQ_STOI_EVERY_EPOCH=False
PESQ_STOI_EVERY_N_EPOCHS=2
MAX_METRIC_BATCHES=10


ESC50_CONTINUOUS = {
    "rain",
    "sea_waves",
    "wind",
    "thunderstorm",
    "water_drops",
    "pouring_water",
    "crackling_fire",
    "engine",
    "vacuum_cleaner",
    "washing_machine",
    "train",
    "airplane",
    "helicopter"
}

ESC50_TRANSIENT = {
    "door_wood_knock",
    "glass_breaking",
    "car_horn",
    "siren",
    "clock_alarm",
    "mouse_click",
    "keyboard_typing",
    "can_opening",
    "church_bells",
    "clapping",
    "fireworks"
}


def make_group_norm(channels,max_groups=8):
    groups=min(channels,max_groups)
    while groups>1 and channels%groups!=0:
        groups-=1
    return nn.GroupNorm(groups,channels)

class SEBlock(nn.Module): # attention layer
    def __init__(self,channels,reduction=8):
        super().__init__()
        self.pool=nn.AdaptiveAvgPool2d(1)
        hidden=max(channels//reduction,4)
        self.fc=nn.Sequential(
            nn.Conv2d(channels,hidden,kernel_size=1,bias=False),
            nn.SiLU(inplace=True),
            nn.Conv2d(hidden,channels,kernel_size=1,bias=False),
            nn.Sigmoid()
        )

    def forward(self,x):
        w=self.pool(x)
        w=self.fc(w)
        return w*x

class ResSEBlock(nn.Module):
    def __init__(self,in_c,out_c,stride):
        super().__init__()
        self.act=nn.SiLU(inplace=True)

        self.conv1=nn.Conv2d(in_c,out_c,kernel_size=3,stride=stride,padding=1)
        self.gn1=make_group_norm(out_c) # best for realtime

        self.conv2=nn.Conv2d(out_c,out_c,kernel_size=3,padding=1)
        self.gn2=make_group_norm(out_c)

        self.se=SEBlock(out_c)

        if stride!=1 or in_c!=out_c:
            self.shortcut=nn.Sequential(
                nn.Conv2d(in_c,out_c,kernel_size=1,stride=stride),
                make_group_norm(out_c)
            )
        else :
            self.shortcut=nn.Identity()

    def forward(self,x):
        identity=self.shortcut(x)

        out=self.conv1(x)
        out=self.gn1(out)
        out=self.act(out)

        out=self.conv2(out)
        out=self.gn2(out)

        out=self.se(out)

        out=out+identity
        out=self.act(out)

        return out

def up_Block(in_c,out_c):
    return nn.Sequential(
        nn.Upsample(scale_factor=(2,1),mode='bilinear',align_corners=False),
        nn.Conv2d(in_c,out_c,kernel_size=3,padding=1),
        make_group_norm(out_c),
        nn.SiLU(inplace=True)
    )

class Model (nn.Module):
    def __init__(self, base=48,gru_hidden_sz=256,layers=1,freq_bins=256):
        super().__init__()
        self.base=base
        self.gru_hidden_sz=gru_hidden_sz
        self.layers=layers
        self.freq_bins=freq_bins

        # Encoding
        self.enc1=ResSEBlock(2,self.base,stride=(2,1))
        self.enc2=ResSEBlock(self.base,self.base*2,stride=(2,1))
        self.enc3=ResSEBlock(self.base*2,self.base*4,stride=(2,1))
        self.enc4=ResSEBlock(self.base*4,self.base*8,stride=(2,1))


        # GRU

        self.bottleneck_freq_bins=self.freq_bins//16
        self.gru_in_sz=(self.base*8)*self.bottleneck_freq_bins


        self.gru=nn.GRU(
            input_size=self.gru_in_sz,
            hidden_size=self.gru_hidden_sz,
            num_layers=self.layers,
            batch_first=True,
            bidirectional=False
        )

        self.gru_fc=nn.Sequential(
            nn.Linear(self.gru_hidden_sz,self.gru_in_sz),
            nn.SiLU(inplace=True),
        )

        # DECODE
        self.dec4=up_Block(self.base*16,self.base*4)
        self.dec3=up_Block(self.base*8,self.base*2)
        self.dec2=up_Block(self.base*4,self.base)

        # self.mask_conv=nn.Sequential()-----------
        self.mask_conv=nn.Sequential(
            nn.Upsample(scale_factor=(2,1),mode='bilinear',align_corners=False),
            nn.Conv2d(self.base*2,2,kernel_size=3,padding=1)
        )

        self.sig=nn.Sigmoid()

    @staticmethod
    def match_shape(x,target):
        diff_f=target.size(2)-x.size(2)
        diff_t=target.size(3)-x.size(3)
        if diff_f==0 and diff_t==0:
            return x
        return F.pad(x,(diff_t//2,diff_t-diff_t//2,diff_f//2,diff_f-diff_f//2,))


    def forward(self,x,h=None):
        e1=self.enc1(x)
        e2=self.enc2(e1)
        e3=self.enc3(e2)
        e4=self.enc4(e3)

        b,c,f,t=e4.shape

        # seq -------------------
        seq=e4.permute(0,3,1,2).reshape(b,t,c*f)

        if c*f!=self.gru_in_sz:
            raise ValueError(f"GRU input mismatch: got {c*f}, expected {self.gru_in_sz}")

        gru_out,next_h=self.gru(seq,h)
        gru_out=self.gru_fc(gru_out)
        gru_out=gru_out.reshape(b,t,c,f).permute(0,2,3,1)


        d4=self.dec4(torch.cat([gru_out,e4],dim=1))
        d4=self.match_shape(d4,e3)

        d3=self.dec3(torch.cat([d4,e3],dim=1))
        d3=self.match_shape(d3,e2)

        d2=self.dec2(torch.cat([d3,e2],dim=1))
        d2=self.match_shape(d2,e1)


        mask=self.mask_conv(torch.cat([d2,e1],dim=1))
        mask=self.match_shape(mask,x)

        mask=self.sig(mask)

        return mask,next_h

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
    model = Model(
        base=48,
        gru_hidden_sz=512,
        layers=1,
        freq_bins=256
    ).to(device)

    ckpt = torch.load(
        "best_checkpoint.pth",
        map_location=device
    )

    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    return model

def split_spec_chunks(spec,chunk_frames=TRAIN_CHUNK_FRAMES):
    chunks=[]
    original_T=spec.size(-1)
    for start in range(0,original_T,chunk_frames):
        chunk=spec[:,:,:,start:start+chunk_frames]
        if chunk.size(-1)<chunk_frames:
            pad_t=chunk_frames-chunk.size(-1)
            chunk=F.pad(chunk,(0,pad_t))
        chunks.append(chunk)
    return chunks,original_T

def enhance_waveform_streaming(noisy_wav,model,transform,chunk_frames=TRAIN_CHUNK_FRAMES,h=None,detach_every=DETACH_EVERY):
    noisy_spec=transform.audio_to_spectrogram(noisy_wav)
    chunks,original_T=split_spec_chunks(noisy_spec,chunk_frames=chunk_frames)
    enhanced_chunks=[]
    next_h=h

    for i,spec_chunk in enumerate(chunks):
        mask,next_h=model(spec_chunk,next_h)
        enhanced_chunk=transform.apply_mask(spec_chunk,mask)
        enhanced_chunks.append(enhanced_chunk)

        if detach_every is not None and (i+1)%detach_every==0:
            if next_h is not None:
                next_h=next_h.detach()
    enhanced_spec=torch.cat(enhanced_chunks,dim=-1)
    enhanced_spec=enhanced_spec[:,:,:,:original_T]

    enhanced_wav=transform.spectrogram_to_audio(enhanced_spec,target_num_samples=noisy_wav.shape[-1])

    return enhanced_wav,enhanced_spec,next_h
