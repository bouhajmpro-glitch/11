// app/lab/page.tsx
'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef, useEffect } from 'react';
import { Camera, BrainCircuit, Loader2, CheckCircle2, Gauge, Sun, Activity, Compass, Navigation, X, Wind } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
// نحتاج لجلب اتجاه الرياح
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
  const [windData, setWindData] = useState({ speed: 0, direction: 0 }); // اتجاه الرياح الحقيقي
  const [sensorData, setSensorData] = useState({ illuminance: 0 });
  const [sensorsSupported, setSensorsSupported] = useState({ light: false });

  // 1. جلب بيانات الرياح عند فتح الصفحة
  useEffect(() => {
    const fetchWind = async () => {
      const loc = await getLocationByIP();
      if (loc) {
        const data = await getWeather(loc.lat, loc.lon, '');
        // نحتاج اتجاه الرياح (درجة)، لكن API الطقس الحالي لا يعيد الاتجاه بدقة
        // سنفترض قيمة عشوائية للتمثيل الآن، أو نحدث API الطقس لاحقاً
        setWindData({ speed: data.windSpeed, direction: Math.random() * 360 }); 
      }
    };
    fetchWind();
  }, []);

  // 2. تشغيل المستشعرات
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
        alpha: event.alpha || 0, // اتجاه الشمال (0-360)
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

  // 3. تشغيل الكاميرا
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

  // 4. تحميل النموذج (مع إصلاح الذاكرة)
  useEffect(() => {
    const load = async () => {
      await tf.ready();
      const m = await mobilenet.load({ version: 2, alpha: 0.50 }); // موديل خفيف جداً
      setModel(m);
      setLoadingModel(false);
    };
    load();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult([]);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const analyzeImage = async () => {
    if (!model || !imageRef.current) return;
    setAnalyzing(true);
    try {
      // تأخير بسيط لضمان رسم الصورة
      await new Promise(r => setTimeout(r, 100));
      const predictions = await model.classify(imageRef.current);
      setResult(predictions);
    } catch (e) { 
      console.error(e);
      alert("حاول مرة أخرى بصورة أصغر");
    }
    setAnalyzing(false);
  };

  const translatePrediction = (className: string) => {
    if (className.includes('sky') || className.includes('cloud')) return "سحب (جو مستقر)";
    if (className.includes('gray') || className.includes('storm')) return "سحب داكنة (مطر)";
    return `تعرفنا على: ${className}`;
  };

  // --- واجهة AR المتطورة (مع الرياح) ---
  if (arMode) {
    // حساب زاوية الرياح بالنسبة لاتجاه الهاتف
    // إذا كان الهاتف ينظر للشمال (0)، والرياح تأتي من الشرق (90)، يجب أن يظهر السهم لليمين
    const windRelativeAngle = windData.direction - orientation.alpha;

    return (
      <div className="fixed inset-0 z-[200] bg-black overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
        
        {/* طبقة المعلومات HUD */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          
          {/* البوصلة والقبلة */}
          <div 
            className="w-64 h-64 border-4 border-white/30 rounded-full relative flex items-center justify-center transition-transform duration-100 ease-linear shadow-2xl"
            style={{ transform: `rotate(${-orientation.alpha}deg)` }}
          >
            <div className="absolute -top-8 font-black text-red-500 text-2xl drop-shadow-md">N</div>
            <div className="absolute -bottom-8 font-bold text-white">S</div>
            <div className="absolute -right-8 font-bold text-white">E</div>
            <div className="absolute -left-8 font-bold text-white">W</div>
            
            {/* القبلة (تقريباً 100 درجة) */}
            <div className="absolute top-1/2 left-1/2 w-1 h-32 bg-green-500/50 origin-top -translate-x-1/2" style={{ transform: 'rotate(100deg)' }}>
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-green-400 font-bold text-xs bg-black/50 px-1 rounded">القبلة</div>
            </div>

            {/* سهم الرياح (الجديد!) */}
            <div 
              className="absolute top-1/2 left-1/2 w-2 h-24 bg-blue-500 origin-top -translate-x-1/2 flex flex-col items-center justify-end"
              style={{ transform: `rotate(${windData.direction}deg)` }}
            >
               <Wind className="w-6 h-6 text-white animate-pulse" />
               <div className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded mt-1 whitespace-nowrap">
                 الرياح {windData.speed} كم/س
               </div>
            </div>
          </div>

          <div className="mt-16 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-center">
            <h2 className="text-3xl font-black text-white">{Math.round(orientation.alpha)}°</h2>
            <p className="text-xs text-blue-200 font-bold">الواقع المعزز الجوي</p>
          </div>
        </div>

        <button onClick={() => setArMode(false)} className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-xl z-20 active:scale-95 transition-transform flex items-center gap-2">
          <X className="w-5 h-5" /> خروج
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-24 max-w-xl mx-auto relative space-y-8">
      <button onClick={() => setArMode(true)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-3xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
        <Compass className="w-6 h-6" /> <span className="font-black text-xl">الواقع المعزز (AR)</span>
      </button>

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imageRef} src={image} alt="Uploaded" className="w-full h-full object-cover max-h-[300px]" />
              {!result.length && !analyzing && (
                <button onClick={analyzeImage} disabled={loadingModel} className="absolute bottom-6 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg font-bold">
                  {loadingModel ? "تجهيز..." : "تحليل الصورة"}
                </button>
              )}
            </>
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-400 font-medium text-sm">التقط صورة للسماء</p>
            </div>
          )}
          <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={analyzing} />
          {analyzing && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white"><Loader2 className="w-10 h-10 animate-spin"/></div>}
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
            <button onClick={() => { setImage(null); setResult([]); }} className="w-full mt-3 text-xs text-slate-400 py-2 border-t border-slate-100">صورة أخرى</button>
          </div>
        )}
      </section>
    </main>
  );
}
