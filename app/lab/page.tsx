// app/lab/page.tsx
'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef, useEffect } from 'react';
// تم إضافة Sun و Gauge للقائمة لضمان عدم حدوث خطأ
import { Camera, BrainCircuit, Loader2, CheckCircle2, Activity, Compass, Navigation, X, Wind, RotateCw, Sun, Gauge } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { getWeather, getLocationByIP } from '../weather';

export default function LabPage() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any[]>([]);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // حالات AR
  const [arMode, setArMode] = useState(false);
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [windData, setWindData] = useState({ speed: 0, direction: 0 });
  const [sensorData, setSensorData] = useState({ illuminance: 0 });
  const [sensorsSupported, setSensorsSupported] = useState({ light: false });

  // 1. تحميل النموذج (بسيط ومستقر)
  useEffect(() => {
    const load = async () => {
      try {
        await tf.ready();
        const m = await mobilenet.load({ version: 2, alpha: 0.50 });
        setModel(m);
        setLoadingModel(false);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  // 2. المستشعرات
  useEffect(() => {
    if (typeof window !== 'undefined' && 'AmbientLightSensor' in window) {
      try {
        // @ts-ignore
        const sensor = new AmbientLightSensor();
        sensor.addEventListener('reading', () => setSensorData(prev => ({ ...prev, illuminance: sensor.illuminance })));
        sensor.start();
        setSensorsSupported(prev => ({ ...prev, light: true }));
      } catch (err) {}
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      setOrientation({ 
        alpha: event.alpha || 0, 
        beta: event.beta || 0, 
        gamma: event.gamma || 0 
      });
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // 3. بيانات الرياح
  useEffect(() => {
    const fetchWind = async () => {
      const loc = await getLocationByIP();
      if (loc) {
        const data = await getWeather(loc.lat, loc.lon, '');
        setWindData({ speed: data.windSpeed, direction: Math.random() * 360 }); 
      }
    };
    fetchWind();
  }, []);

  // 4. الكاميرا
  useEffect(() => {
    const currentVideo = videoRef.current;
    if (arMode && currentVideo) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => { if (currentVideo) currentVideo.srcObject = stream; })
        .catch(err => console.error(err));
    }
    return () => {
      if (currentVideo && currentVideo.srcObject) {
        (currentVideo.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, [arMode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImage(ev.target?.result as string);
        setResult([]);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const analyzeImage = async () => {
    if (!model || !imageRef.current) return;
    setAnalyzing(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const predictions = await model.classify(imageRef.current);
      setResult(predictions);
    } catch (e) { alert("خطأ في التحليل."); }
    setAnalyzing(false);
  };

  const translatePrediction = (className: string) => {
    if (className.includes('sky') || className.includes('cloud')) return "سحب (جو مستقر)";
    if (className.includes('gray') || className.includes('storm')) return "سحب داكنة (مطر)";
    return `تعرفنا على: ${className}`;
  };

  if (arMode) {
    return (
      <div className="fixed inset-0 z-[200] bg-black overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="w-64 h-64 border-4 border-white/30 rounded-full relative flex items-center justify-center transition-transform duration-100 ease-linear shadow-2xl" style={{ transform: `rotate(${-orientation.alpha}deg)` }}>
            <div className="absolute -top-8 font-black text-red-500 text-2xl">N</div>
            <div className="absolute -bottom-8 font-bold text-white">S</div>
            <div className="absolute -right-8 font-bold text-white">E</div>
            <div className="absolute -left-8 font-bold text-white">W</div>
            <div className="absolute top-1/2 left-1/2 w-1 h-32 bg-green-500/50 origin-top -translate-x-1/2" style={{ transform: 'rotate(100deg)' }}><div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-green-400 font-bold text-xs bg-black/50 px-1 rounded">القبلة</div></div>
            <div className="absolute top-1/2 left-1/2 w-2 h-24 bg-blue-500 origin-top -translate-x-1/2 flex flex-col items-center justify-end" style={{ transform: `rotate(${windData.direction}deg)` }}><Wind className="w-6 h-6 text-white animate-pulse" /></div>
          </div>
          <div className="mt-16 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-center">
            <h2 className="text-3xl font-black text-white">{Math.round(orientation.alpha)}°</h2>
            <p className="text-xs text-blue-200 font-bold">بوصلة الطقس</p>
          </div>
        </div>
        <button onClick={() => setArMode(false)} className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-xl z-20 active:scale-95">خروج</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-24 max-w-xl mx-auto relative space-y-8">
      <button onClick={() => setArMode(true)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-3xl shadow-xl flex items-center justify-center gap-3"><Compass className="w-6 h-6" /> <span className="font-black text-xl">الواقع المعزز (AR)</span></button>
      
      <section className="animate-in slide-in-from-top duration-500">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-red-500" /> المستشعرات</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border border-yellow-200 bg-yellow-50 flex flex-col items-center text-center">
            <Sun className="w-6 h-6 mb-2 text-yellow-500" />
            <span className="text-xs text-slate-500 font-bold">الإضاءة</span>
            <span className="text-xl font-black text-slate-800">{sensorsSupported.light ? Math.round(sensorData.illuminance) : "--"}</span>
          </div>
          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50 flex flex-col items-center text-center">
            <Navigation className="w-6 h-6 mb-2 text-blue-500" style={{ transform: `rotate(${orientation.alpha}deg)` }} />
            <span className="text-xs text-slate-500 font-bold">الشمال</span>
            <span className="text-xl font-black text-slate-800">{Math.round(orientation.alpha)}°</span>
          </div>
        </div>
      </section>

      <section>
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden relative min-h-[250px] flex flex-col items-center justify-center group">
          {image ? (
            <>
              <img ref={imageRef} src={image} alt="Uploaded" className="w-full h-full object-cover max-h-[300px]" />
              <label className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full cursor-pointer z-20"><RotateCw className="w-4 h-4" /><input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" disabled={analyzing} /></label>
              {!result.length && !analyzing && (
                <button onClick={analyzeImage} disabled={loadingModel} className="absolute bottom-6 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg font-bold z-30">
                  {loadingModel ? "انتظر..." : "تحليل الصورة"}
                </button>
              )}
            </>
          ) : (
            <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-8"><Camera className="w-8 h-8 text-slate-400 mb-4" /><p className="text-slate-400 font-medium text-sm">التقط صورة للسماء</p><input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" disabled={analyzing} /></label>
          )}
          {analyzing && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white z-40"><Loader2 className="w-10 h-10 animate-spin"/></div>}
        </div>
        {result.length > 0 && (
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 mb-2 text-sm">النتيجة:</h3>
            {result.slice(0, 1).map((res, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm">{translatePrediction(res.className)}</span>
                <span className="text-indigo-600 font-black text-sm">{Math.round(res.probability * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
