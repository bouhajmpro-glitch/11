// app/lab/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, BrainCircuit, Loader2, CheckCircle2, Gauge, Sun, Activity, Thermometer } from 'lucide-react';
/* eslint-disable @next/next/no-img-element */
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

export default function LabPage() {
  // --- حالات الذكاء الاصطناعي (القديمة) ---
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any[]>([]);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  // --- حالات المستشعرات (الجديدة) ---
  const [sensorData, setSensorData] = useState({
    illuminance: 0, // الإضاءة (Lux)
    pressure: 0,    // الضغط (hPa) - نادراً ما يتاح
    temperature: 0, // الحرارة (غير متاحة مباشرة غالباً)
    motion: { x: 0, y: 0, z: 0 } // الحركة (Accelerometer)
  });
  const [sensorsSupported, setSensorsSupported] = useState({
    light: false,
    motion: false
  });

  // --- 1. تشغيل المستشعرات ---
  useEffect(() => {
    // مستشعر الإضاءة (AmbientLightSensor)
    if ('AmbientLightSensor' in window) {
      try {
        // @ts-ignore
        const sensor = new AmbientLightSensor();
        sensor.addEventListener('reading', () => {
          setSensorData(prev => ({ ...prev, illuminance: sensor.illuminance }));
        });
        sensor.start();
        setSensorsSupported(prev => ({ ...prev, light: true }));
      } catch (err) { console.log("Light sensor blocked"); }
    }

    // مستشعر الحركة (لقياس اهتزاز الرياح مثلاً مستقبلاً)
    if ('Accelerometer' in window) {
      try {
        // @ts-ignore
        const acc = new Accelerometer({ frequency: 10 });
        acc.addEventListener('reading', () => {
          setSensorData(prev => ({ 
            ...prev, 
            motion: { x: acc.x, y: acc.y, z: acc.z } 
          }));
        });
        acc.start();
        setSensorsSupported(prev => ({ ...prev, motion: true }));
      } catch (err) { console.log("Accelerometer blocked"); }
    }
  }, []);

  // --- 2. تحميل نموذج AI ---
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await mobilenet.load({ version: 2, alpha: 1.0 });
        setModel(loadedModel);
        setLoadingModel(false);
      } catch (e) { console.error("فشل تحميل النموذج", e); }
    };
    loadModel();
  }, []);

  // معالجة الصورة
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!model || !imageRef.current) return;
    setAnalyzing(true);
    try {
      const predictions = await model.classify(imageRef.current);
      setResult(predictions);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };

  const translatePrediction = (className: string) => {
    if (className.includes('sky') || className.includes('cloud')) return "تشكيل سحابي مرتفع (استقرار)";
    if (className.includes('gray') || className.includes('storm')) return "سحب داكنة (احتمال أمطار)";
    return `تعرفنا على نمط: ${className}`;
  };

  return (
    <main className="min-h-screen p-4 pb-24 max-w-xl mx-auto relative space-y-8">
      
      {/* --- القسم 1: المستشعرات الحية (الجديد) --- */}
      <section className="animate-in slide-in-from-top duration-500">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-6 h-6 text-red-500 animate-pulse" />
          قراءات المحطة الحية
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          {/* بطاقة الإضاءة */}
          <div className={`p-4 rounded-2xl border ${sensorsSupported.light ? 'border-yellow-200 bg-yellow-50' : 'border-slate-200 bg-slate-50'} flex flex-col items-center text-center`}>
            <Sun className={`w-8 h-8 mb-2 ${sensorsSupported.light ? 'text-yellow-500 animate-spin-slow' : 'text-slate-400'}`} />
            <span className="text-xs text-slate-500 font-bold mb-1">شدة الضوء (Lux)</span>
            <span className="text-2xl font-black text-slate-800">
              {sensorsSupported.light ? Math.round(sensorData.illuminance) : "--"}
            </span>
            {!sensorsSupported.light && <span className="text-[10px] text-red-400 mt-1">غير مدعوم</span>}
          </div>

          {/* بطاقة الحركة (ثبات الجهاز) */}
          <div className={`p-4 rounded-2xl border ${sensorsSupported.motion ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'} flex flex-col items-center text-center`}>
            <Gauge className={`w-8 h-8 mb-2 ${sensorsSupported.motion ? 'text-blue-500' : 'text-slate-400'}`} />
            <span className="text-xs text-slate-500 font-bold mb-1">ثبات الجهاز</span>
            <span className="text-2xl font-black text-slate-800">
              {sensorsSupported.motion 
                ? (Math.abs(sensorData.motion.x) < 0.5 ? "مستقر" : "مهتز") 
                : "--"}
            </span>
          </div>
        </div>
        
        <div className="mt-2 p-3 bg-slate-100 rounded-xl text-xs text-slate-500 leading-relaxed">
          ℹ️ <b>معلومة تقنية:</b> يتم قراءة هذه البيانات مباشرة من مستشعرات هاتفك. إذا لم تظهر الأرقام، فهذا يعني أن متصفحك يحجب الوصول للمستشعرات لأسباب أمنية (Chrome يتطلب تفعيل flags أحياناً).
        </div>
      </section>

      <hr className="border-slate-200" />

      {/* --- القسم 2: محلل الصور (القديم) --- */}
      <section>
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">محلل السماء البصري</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative min-h-[250px] flex flex-col items-center justify-center group">
          {image ? (
            <>
              <img ref={imageRef} src={image} alt="Uploaded" className="w-full h-full object-cover max-h-[300px]" />
              {!result.length && !analyzing && (
                <button 
                  onClick={analyzeImage}
                  disabled={loadingModel}
                  className="absolute bottom-6 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 flex items-center gap-2 font-bold"
                >
                  <BrainCircuit className="w-5 h-5" /> {loadingModel ? "انتظر..." : "تحليل"}
                </button>
              )}
            </>
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200 group-hover:border-indigo-400 transition-colors">
                <Camera className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
              </div>
              <p className="text-slate-400 font-medium">صور السماء للتحليل</p>
            </div>
          )}
          
          <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={analyzing} />
          
          {analyzing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <Loader2 className="w-10 h-10 mb-3 animate-spin text-indigo-400" />
              <p className="font-bold animate-pulse">جاري التحليل...</p>
            </div>
          )}
        </div>

        {result.length > 0 && (
          <div className="mt-4 animate-in slide-in-from-bottom duration-500">
            <div className="bg-white rounded-2xl shadow border border-slate-100 p-4">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> النتيجة</h3>
              <div className="space-y-2">
                {result.slice(0, 2).map((res, index) => (
                  <div key={index} className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-700 text-xs">{translatePrediction(res.className)}</span>
                    <span className="text-indigo-600 font-black text-xs">{Math.round(res.probability * 100)}%</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setImage(null); setResult([]); }} className="w-full mt-3 py-2 text-slate-400 hover:text-slate-600 text-xs">صورة أخرى</button>
            </div>
          </div>
        )}
      </section>

    </main>
  );
}
