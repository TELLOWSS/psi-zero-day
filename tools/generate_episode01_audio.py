#!/usr/bin/env python3
"""Deterministic Episode 01 production-v1 field sound generator.
No external recordings, speech, samples, or copyrighted audio are used.
Outputs 48 kHz stereo Ogg/Opus assets and updates the production contract.
"""
from pathlib import Path
import hashlib, json, math, subprocess, wave
import numpy as np

SR=48000
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/episode01/audio'
CONTRACT=ROOT/'content/episode01/audio-production.json'
OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(505349)

def filt(x,lo=0.0,hi=None):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR)
    m=np.ones_like(f)
    if lo:
        m*=np.clip((f-lo*.72)/(lo*.28),0,1)
    if hi:
        m*=np.clip((hi*1.28-f)/(hi*.28),0,1)
    return np.fft.irfft(X*m,n=len(x))

def tone(freq,n,phase=0):
    t=np.arange(n)/SR
    return np.sin(2*np.pi*freq*t+phase)

def pan(x,p=0.0):
    return np.stack([x*math.sqrt((1-p)*.5),x*math.sqrt((1+p)*.5)],axis=1)

def fade(n,a=.025,r=.08):
    e=np.ones(n); aa=min(n,max(1,int(a*SR))); rr=min(n,max(1,int(r*SR)))
    e[:aa]=np.linspace(0,1,aa); e[-rr:]=np.linspace(1,0,rr)
    return e

def noise(n,lo=0,hi=None):
    return filt(rng.normal(size=n),lo,hi)

def add_tone(st,start,dur,freq,amp,p=0,sweep=None,square=False):
    i=int(start*SR); n=min(len(st)-i,int(dur*SR))
    if n<=0:return
    t=np.arange(n)/SR
    if sweep:
        f0,f1=sweep; phase=2*np.pi*(f0*t+(f1-f0)*t*t/(2*dur)); y=np.sin(phase)
    else:
        y=np.sin(2*np.pi*freq*t)
        if square:y=np.sign(y)
    st[i:i+n]+=pan(y*fade(n,min(.03,dur*.2),min(.08,dur*.3))*amp,p)

def add_noise(st,start,dur,amp,lo=0,hi=None,p=0):
    i=int(start*SR); n=min(len(st)-i,int(dur*SR))
    if n<=0:return
    st[i:i+n]+=pan(noise(n,lo,hi)*fade(n,min(.04,dur*.2),min(.1,dur*.3))*amp,p)

def hit(st,sec,amp=.05,p=0,metal=False):
    i=int(sec*SR); n=min(len(st)-i,int(.22*SR))
    if n<=0:return
    t=np.arange(n)/SR
    if metal:y=(np.sin(2*np.pi*760*t)+.6*np.sin(2*np.pi*1180*t)+.35*np.sin(2*np.pi*1840*t))*np.exp(-18*t)
    else:y=(np.sin(2*np.pi*85*t)+.5*np.sin(2*np.pi*130*t))*np.exp(-22*t)
    st[i:i+n]+=pan(y*amp,p)

def master(st,peak_db=-9):
    st=np.tanh(st*1.15); f=min(int(.04*SR),len(st)//2)
    st[:f]*=np.linspace(0,1,f)[:,None]; st[-f:]*=np.linspace(1,0,f)[:,None]
    pk=max(float(np.max(np.abs(st))),1e-9); st*=10**(peak_db/20)/pk
    return st.astype(np.float32)

def gate_queue():
    d=6.4;n=int(d*SR);t=np.arange(n)/SR;st=np.zeros((n,2))
    st+=pan((tone(48,n)*.10+tone(96,n,.5)*.045)*(.7+.3*np.sin(2*np.pi*.22*t)),-.15)
    st+=pan(noise(n,0,800)*.018+noise(n,900,3200)*.007,.2)
    for tm in [1.85,2.18,4.55,4.88]:add_tone(st,tm,.18,1180,.035,.5,square=True)
    for tm,p in [(1.1,-.5),(3.35,.4),(5.4,-.2)]:hit(st,tm,.06,p,True)
    return master(st,-9)

def radio_burst():
    d=1.22;n=int(d*SR);st=np.zeros((n,2));hit(st,.015,.14,-.1)
    add_noise(st,.02,.19,.12,750,4200,-.05);add_tone(st,.035,.12,1550,.03,square=True)
    i=int(.23*SR);m=int(.67*SR);t=np.arange(m)/SR
    y=noise(m,280,2600)*(.42+.30*np.sin(2*np.pi*5.2*t)+.18*np.sin(2*np.pi*8.6*t+.7))*fade(m,.02,.09)*.035
    st[i:i+m]+=pan(y,.03);add_noise(st,.87,.25,.07,900,5000,.1)
    return master(st,-7.5)

def workface():
    d=4.8;n=int(d*SR);t=np.arange(n)/SR;st=np.zeros((n,2))
    st+=pan((tone(67,n)*.075+tone(134,n,.8)*.025)*(.75+.25*np.sin(2*np.pi*.55*t)),.15)
    st+=pan(noise(n,180,2600)*.017,-.05)
    for tm,p in [(0.7,-.6),(1.45,.35),(2.1,-.15),(2.95,.6),(3.65,-.4),(4.2,.2)]:hit(st,tm,.07,p,True)
    for tm,p in [(1,-.4),(1.22,.25),(3.2,.1),(3.42,-.25)]:hit(st,tm,.045,p)
    return master(st,-9)

def pump():
    d=7.2;n=int(d*SR);t=np.arange(n)/SR;st=np.zeros((n,2));rise=np.clip(t/2,0,1);pulse=.78+.22*np.sin(2*np.pi*4.2*t)
    st+=pan((tone(44,n)*.12+tone(88,n,.3)*.06+tone(132,n,.8)*.025)*pulse*(.55+.45*rise),.25)
    st+=pan(noise(n,0,700)*.018*(.6+.4*rise),.2)
    add_tone(st,2.7,1.8,330,.022,-.1,(290,480));add_tone(st,4.7,1.2,410,.018,.2,(450,315))
    for tm,p in [(1.3,.5),(3.85,-.3),(5.9,.35)]:hit(st,tm,.075,p,True)
    return master(st,-8.5)

def pour():
    d=7.8;n=int(d*SR);t=np.arange(n)/SR;st=np.zeros((n,2))
    slurry=noise(n,0,1500)*.036+noise(n,120,520)*.03;pulse=.72+.20*np.sin(2*np.pi*2.6*t)+.08*np.sin(2*np.pi*5.2*t+.7)
    st+=pan(slurry*pulse,-.05);st+=pan((tone(58,n)*.055+tone(116,n,.4)*.018)*(.78+.22*np.sin(2*np.pi*2.6*t)),.2)
    for tm,p in [(1.6,-.45),(3,.45),(4.55,-.2),(6.3,.3)]:hit(st,tm,.045,p)
    for tm,p in [(2.35,.5),(5.25,-.5)]:hit(st,tm,.04,p,True)
    return master(st,-9)

def stopwork():
    d=2.6;n=int(d*SR);t=np.arange(n)/SR;st=np.zeros((n,2));cut=np.where(t<.72,1,np.exp(-(t-.72)*6.2))
    st+=pan((tone(62,n)*.075+tone(124,n,.5)*.028+noise(n,0,1200)*.018)*cut)
    st+=pan(noise(n,0,1000)*.0045,.05);hit(st,1.8,.025,.55,True)
    return master(st,-10)

def office():
    d=6.3;n=int(d*SR);t=np.arange(n)/SR;st=np.zeros((n,2))
    st+=pan(tone(60,n)*.022+tone(120,n,.2)*.008+noise(n,0,1100)*.006,-.1)
    st+=pan(noise(n,0,220)*.007*(.7+.3*np.sin(2*np.pi*.18*t)),.45)
    for tm,p in [(1.15,-.35),(1.32,-.28),(2.8,.15),(4.1,-.1),(4.28,-.05),(5.35,.2)]:hit(st,tm,.017,p)
    return master(st,-13)

def home():
    d=6.5;n=int(d*SR);t=np.arange(n)/SR;st=np.zeros((n,2))
    st+=pan(noise(n,0,900)*.0035+(tone(50,n)*.012+tone(100,n,.7)*.0035)*(.8+.2*np.sin(2*np.pi*.08*t)),-.15)
    swell=.8*np.exp(-.5*((t-1.4)/.65)**2)+np.exp(-.5*((t-4.8)/.9)**2)
    st+=pan(noise(n,70,650)*.006*swell,.55)
    return master(st,-15)

MAKERS={'gate-queue':gate_queue,'radio-burst':radio_burst,'workface-pressure':workface,'pump-engine-boom':pump,
'concrete-pour':pour,'stopwork-silence-drop':stopwork,'office-report-roomtone':office,'home-night':home}

def write_ogg(name,st):
    wav=OUT/(name+'.wav'); ogg=OUT/(name+'.ogg'); pcm=(np.clip(st,-1,1)*32767).astype('<i2')
    with wave.open(str(wav),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-c:a','libopus','-b:a','96k','-vbr','on','-compression_level','10',str(ogg)],check=True)
    wav.unlink(); data=ogg.read_bytes(); rms=float(np.sqrt(np.mean(st**2))); peak=float(np.max(np.abs(st)))
    return {'file':ogg.name,'bytes':len(data),'duration_sec':round(len(st)/SR,3),'sha256':hashlib.sha256(data).hexdigest(),
      'peak_dbfs':round(20*np.log10(max(peak,1e-9)),2),'rms_dbfs':round(20*np.log10(max(rms,1e-9)),2)}

report=[write_ogg(name,fn()) for name,fn in MAKERS.items()]
contract=json.loads(CONTRACT.read_text(encoding='utf-8'))
contract['status']='production_v1_binaries_present';contract['final_asset_count']=len(report)
contract['production_generation']={
  'method':'deterministic procedural synthesis',
  'generator':'tools/generate_episode01_audio.py',
  'rights':'project-owned generated audio; no external recordings, samples, speech, or music',
  'codec':'Ogg/Opus 48 kHz stereo 96 kbps VBR',
  'review_status':'production_v1; listening QA remains required before store release',
  'assets':report
}
contract['integration']['current']='All eight Episode 01 production-v1 OGG assets are materialized and resolve through the runtime asset manifest; WebAudio fallback remains emergency-only.'
contract['integration']['finalization']='Field-recorded Foley may later replace the same stable asset paths after listening QA without changing story or event rules.'
contract['synthetic_fallback']['status']='emergency_only_if_binary_missing_or_playback_fails'
CONTRACT.write_text(json.dumps(contract,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
