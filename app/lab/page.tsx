// app/lab/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, BrainCircuit, Loader2, CheckCircle2, Gauge, Sun, Activity, Compass, Navigation } from 'lucide-react';
/* eslint-disable @next/next/no-img-element */
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

export default function LabPage() {
  // --- 1. حالات الذكاء الاصطناعي ---
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any[]>([]);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  // --- 2. حالات المستشعرات والواقع المعزز ---
  const [arMode, setArMode] = useState(false);
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 }); // اتجاه الهاتف
  const [sensorData, setSensorData] = useState({ illuminance: 0, motion: { x: 0, y: 0, z: 0 } });
  const [sensorsSupported, setSensorsSupported] = useState({ light: false, motion: false });

  // تفعيل المستشعرات
  useEffect(() => {
    // 1. الإضاءة
    if ('AmbientLightSensor' in window) {
      try {
        // @ts-ignore
        const sensor = new AmbientLightSensor();
        sensor.addEventListener('reading', () => setSensorData(prev => ({ ...prev, illuminance: sensor.illuminance })));
        sensor.start();
        setSensorsSupported(prev => ({ ...prev, light: true }));
      } catch (err) {}
    }

    // 2. البوصلة والاتجاه (DeviceOrientation) - أساس الـ AR
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // alpha: الاتجاه (0-360) حيث 0 هو الشمال
      setOrientation({ 
        alpha: event.alpha || 0, 
        beta: event.beta || 0, 
        gamma: event.gamma || 0 
      });
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // تحميل نموذج الصور
  useEffect(() => {
    mobilenet.load().then(m => { setModel(m); setLoadingModel(false); });
  }, []);

  // دوال الصور
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => { setImage(event.target?.result as string); setResult([]); };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!model || !imageRef.current) return;
    setAnalyzing(true);
    const predictions = await model.classify(imageRef.current);
    setResult(predictions);
    setAnalyzing(false);
  };

  const translatePrediction = (className: string) => {
    if (className.includes('sky') || className.includes('cloud')) return "تشكيل سحابي مرتفع";
    if (className.includes('gray') || className.includes('storm')) return "سحب داكنة (أمطار)";
    return `نمط: ${className}`;
  };

  // --- واجهة الواقع المعزز (AR View) ---
  if (arMode) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden">
        {/* 1. خلفية الكاميرا (محاكاة - في التطبيق الحقيقي نستخدم <video>) */}
        {/* للتبسيط هنا سنستخدم مستشعرات فقط، في المستقبل نربطها بالكاميرا */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
          
          {/* البوصلة الحية */}
          <div 
            className="w-64 h-64 border-4 border-white/20 rounded-full relative flex items-center justify-center transition-transform duration-100 ease-linear"
            style={{ transform: `rotate(${-orientation.alpha}deg)` }}
          >
            {/* علامات الاتجاه */}
            <div className="absolute top-2 font-bold text-red-500 text-xl">N</div>
            <div className="absolute bottom-2 font-bold text-white">S</div>
            <div className="absolute right-4 font-bold text-white">E</div>
            <div className="absolute left-4 font-bold text-white">W</div>
            
            {/* خط الأفق */}
            <div className="w-full h-0.5 bg-white/10 absolute"></div>
            <div className="h-full w-0.5 bg-white/10 absolute"></div>
          </div>

          {/* المعلومات الحية */}
          <div className="mt-8 text-center space-y-2">
            <h2 className="text-2xl font-bold text-blue-400">{Math.round(orientation.alpha)}°</h2>
            <p className="text-sm text-slate-400">وجه هاتفك نحو الأفق</p>
            
            {/* ميزة ذكية: تحديد اتجاه القبلة تقريباً (مثال: 100 درجة) */}
            {Math.abs(orientation.alpha - 100) < 10 && (
              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/50 animate-pulse">
                🕋 اتجاه القبلة (تقريبي)
              </div>
            )}
          </div>

          {/* زر الخروج */}
          <button 
            onClick={() => setArMode(false)}
            className="absolute bottom-10 bg-red-600 px-6 py-3 rounded-full font-bold shadow-lg"
          >
            خروج من وضع AR
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-24 max-w-xl mx-auto relative space-y-8">
      
      {/* زر تفعيل AR */}
      <button 
        onClick={() => setArMode(true)}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
      >
        <Compass className="w-6 h-6" />
        <div className="text-right">
          <span className="block font-bold text-lg">البوصلة الذكية (AR)</span>
          <span className="block text-xs text-blue-100">تحديد الاتجاهات والقبلة</span>
        </div>
      </button>

      {/* --- قسم المستشعرات --- */}
      <section className="animate-in slide-in-from-top duration-500">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-red-500" />
          المستشعرات الحية
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-4 rounded-2xl border ${sensorsSupported.light ? 'border-yellow-200 bg-yellow-50' : 'border-slate-200 bg-slate-50'} flex flex-col items-center text-center`}>
            <Sun className="w-8 h-8 mb-2 text-yellow-500" />
            <span className="text-xs text-slate-500 font-bold">الإضاءة (Lux)</span>
            <span className="text-2xl font-black text-slate-800">{sensorsSupported.light ? Math.round(sensorData.illuminance) : "--"}</span>
          </div>
          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50 flex flex-col items-center text-center">
            <Navigation className="w-8 h-8 mb-2 text-blue-500" style={{ transform: `rotate(${orientation.alpha}deg)` }} />
            <span className="text-xs text-slate-500 font-bold">الاتجاه</span>
            <span className="text-2xl font-black text-slate-800">{Math.round(orientation.alpha)}°</span>
          </div>
        </div>
      </section>

      <hr className="border-slate-200" />

      {/* --- قسم الذكاء الاصطناعي --- */}
      <section>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">محلل السحب</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative min-h-[250px] flex flex-col items-center justify-center">
          {image ? (
            <>
              <img ref={imageRef} src={image} alt="Uploaded" className="w-full h-full object-cover max-h-[300px]" />
              {!result.length && !analyzing && (
                <button onClick={analyzeImage} disabled={loadingModel} className="absolute bottom-6 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg font-bold">
                  {loadingModel ? "انتظر..." : "تحليل الصورة"}
                </button>
              )}
            </>
          ) : (
            <div className="text-center p-8">
              <Camera className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">التقط صورة للسماء</p>
            </div>
          )}
          <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={analyzing} />
          {analyzing && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white"><Loader2 className="w-10 h-10 animate-spin"/></div>}
        </div>

        {result.length > 0 && (
          <div className="mt-4 bg-white rounded-2xl shadow p-4 border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> النتيجة</h3>
            {result.slice(0, 2).map((res, index) => (
              <div key={index} className="flex justify-between p-2 border-b border-slate-50 last:border-0">
                <span className="font-bold text-xs text-slate-700">{translatePrediction(res.className)}</span>
                <span className="text-indigo-600 font-black text-xs">{Math.round(res.probability * 100)}%</span>
              </div>
            ))}
            <button onClick={() => { setImage(null); setResult([]); }} className="w-full mt-2 text-xs text-slate-400">صورة أخرى</button>
          </div>
        )}
      </section>

    </main>
  );
}
