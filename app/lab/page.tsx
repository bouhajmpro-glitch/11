// app/lab/page.tsx
'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef, useEffect } from 'react';
import { Camera, BrainCircuit, Loader2, CheckCircle2, Activity, Compass, Navigation, X, Wind, RotateCw, AlertTriangle, Infinity, Mic, Sun, CloudRain, Snowflake } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { getWeather, getLocationByIP } from '../core/weather/api';

const ManualGauge = ({ title, unit, icon: Icon }: any) => {
  const [val, setVal] = useState(0);
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
      <div className="flex items-center gap-2 mb-2 text-slate-300">
        <Icon className="w-4 h-4" /> <span className="text-xs font-bold">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <input type="range" min="0" max="100" value={val} onChange={e=>setVal(Number(e.target.value))} className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"/>
        <span className="font-mono font-bold text-blue-400 w-12 text-right">{val} {unit}</span>
      </div>
    </div>
  );
};

export default function LabPage() {
  const [image, setImage] = useState<string|null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any[]>([]);
  const [model, setModel] = useState<mobilenet.MobileNet|null>(null);
  const [modelStatus, setModelStatus] = useState<'init' | 'loading' | 'ready' | 'error'>('init');
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [arMode, setArMode] = useState(false);
  const [orientation, setOrientation] = useState({ alpha: 0, absolute: false });
  const [windData, setWindData] = useState({ speed: 0, direction: 0 });
  const [showCalibration, setShowCalibration] = useState(false);
  const [sensorData, setSensorData] = useState({ illuminance: 0 });
  const [sensorsSupported, setSensorsSupported] = useState({ light: false });
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const load = async () => {
      setModelStatus('loading');
      try { await tf.ready(); const m = await mobilenet.load({ version: 2, alpha: 0.50 }); setModel(m); setModelStatus('ready'); } catch (e) { console.error(e); setModelStatus('error'); }
    };
    load();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'AmbientLightSensor' in window) { try { const s = new (window as any).AmbientLightSensor(); s.addEventListener('reading', () => setSensorData(p => ({...p, illuminance: s.illuminance}))); s.start(); setSensorsSupported(p => ({...p, light: true})); } catch {} }
    const h = (e: DeviceOrientationEvent) => {
      // @ts-ignore
      const abs = e.absolute || !!e.webkitCompassHeading;
      // @ts-ignore
      const alpha = e.webkitCompassHeading || Math.abs(360 - (e.alpha || 0));
      setOrientation({ alpha, absolute: abs });
      if (!abs) setShowCalibration(true); else setShowCalibration(false);
    };
    if (window.DeviceOrientationEvent) window.addEventListener('deviceorientation', h);
    const t = setTimeout(() => setShowCalibration(false), 8000);
    return () => { window.removeEventListener('deviceorientation', h); clearTimeout(t); };
  }, []);

  useEffect(() => {
    getLocationByIP().then(ip => { if (ip) getWeather(ip.lat, ip.lon, '').then(d => setWindData({ speed: d.windSpeed, direction: Math.random()*360 })); });
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (arMode && v) navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => { if (v) v.srcObject = s; }).catch(console.error);
    return () => { if (v && v.srcObject) (v.srcObject as MediaStream).getTracks().forEach(t => t.stop()); };
  }, [arMode]);

  const handleImage = (e: any) => { if (e.target.files[0]) { const r = new FileReader(); r.onload = ev => { if(ev.target) { setImage(ev.target.result as string); setResult([]); }}; r.readAsDataURL(e.target.files[0]); }};
  
  const analyze = async () => { if (model && imageRef.current) { setAnalyzing(true); await new Promise(r => setTimeout(r, 100)); const p = await model.classify(imageRef.current); setResult(p); setAnalyzing(false); }};

  // --- الدالة التي كانت مفقودة ---
  const startListening = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext(); 
      const src = ctx.createMediaStreamSource(s); 
      const anz = ctx.createAnalyser(); 
      src.connect(anz);
      const buf = new Uint8Array(anz.frequencyBinCount);
      setIsListening(true);
      const loop = () => { 
        anz.getByteFrequencyData(buf); 
        setAudioLevel(Math.round(buf.reduce((a,b)=>a+b)/buf.length)); 
        if (isListening) requestAnimationFrame(loop); 
      };
      loop();
    } catch { alert("Mic Error"); }
  };

  if (arMode) return (
    <div className="fixed inset-0 z-[200] bg-black overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80"/>
      {showCalibration && <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/70 text-white p-4 rounded-2xl border border-yellow-500/50 text-center"><Infinity className="w-8 h-8 text-yellow-400 mx-auto animate-pulse"/> المعايرة مطلوبة</div>}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <div className="w-64 h-64 border-4 border-white/30 rounded-full relative flex items-center justify-center shadow-2xl" style={{ transform: `rotate(${-orientation.alpha}deg)` }}>
          <div className="absolute -top-8 text-red-500 font-black text-2xl">N</div>
          <div className="absolute top-1/2 left-1/2 w-2 h-24 bg-blue-500 origin-top -translate-x-1/2 flex flex-col items-center justify-end" style={{ transform: `rotate(${windData.direction}deg)` }}><Wind className="w-6 h-6 text-white animate-pulse"/></div>
        </div>
        <div className="mt-16 bg-black/60 px-6 py-3 rounded-2xl text-center"><h2 className="text-3xl font-black text-white">{Math.round(orientation.alpha)}°</h2></div>
      </div>
      <button onClick={() => setArMode(false)} className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-xl z-20">خروج</button>
    </div>
  );

  return (
    <main className="min-h-screen p-4 pb-24 bg-slate-900 text-white space-y-8">
      <button onClick={() => setArMode(true)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-3xl shadow-xl flex items-center justify-center gap-3"><Compass className="w-6 h-6"/><span className="font-black text-xl">الواقع المعزز (AR)</span></button>
      
      <section className="bg-white/10 rounded-3xl p-6 border border-white/10 text-center">
        <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4 relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 transition-transform" style={{transform: `scale(${1 + audioLevel/50})`}}></div>
          <Mic className="w-6 h-6 text-blue-400 relative z-10"/>
        </div>
        <button onClick={startListening} className="bg-blue-600 px-6 py-2 rounded-full font-bold text-sm mb-2">{isListening ? `${audioLevel} dB` : "قياس ضجيج المطر"}</button>
      </section>

      <section className="bg-white/10 rounded-3xl p-1 overflow-hidden border border-white/10">
        <div className="relative h-64 bg-black/50 rounded-2xl flex items-center justify-center overflow-hidden">
          {image ? <img ref={imageRef} src={image} className="w-full h-full object-cover" alt="sky"/> : <Camera className="w-12 h-12 text-slate-500"/>}
          <input type="file" accept="image/*" capture="environment" onChange={handleImage} className="absolute inset-0 opacity-0 z-10" />
          {analyzing && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin"/></div>}
        </div>
        {image && !analyzing && <button onClick={analyze} className="w-full bg-indigo-600 p-3 font-bold text-sm mt-1">تحليل الصورة</button>}
        {result.length > 0 && <div className="p-4 text-center font-bold text-green-400">{result[0].className}</div>}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 px-2">أدوات القياس اليدوي</h3>
        <ManualGauge title="مقياس المطر التراكمي" unit="mm" icon={CloudRain} />
        <ManualGauge title="عمق الثلوج" unit="cm" icon={Snowflake} />
      </section>
    </main>
  );
}
