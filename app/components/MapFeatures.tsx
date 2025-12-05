'use client';

import { useState, useEffect } from 'react';
import { useMap, useMapEvents, Popup } from 'react-leaflet';
import { 
  Thermometer, Wind, Activity, Droplets, 
  Navigation, CloudLightning, AlertTriangle, 
  Gauge, Factory, MapPin 
} from 'lucide-react';

// استيراد خدمة جودة الهواء من المسار الجديد الصحيح (hazards)
import { fetchAirQuality } from '../core/hazards/hazardService';

// --- الميزة 1: الموجه التلقائي (Auto Pilot) ---
export function UserLocator() {
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      map.flyTo(e.latlng, 10, {
        animate: true,
        duration: 1.5
      });
    });
  }, [map]);

  return null;
}

// --- الميزة 2: مختبر التحليل الميداني (Field Lab Inspector) ---
export function ClickInspector() {
  const [position, setPosition] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [aqi, setAqi] = useState<any>(null); // حالة جودة الهواء
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      runFullAnalysis(e.latlng.lat, e.latlng.lng);
    },
  });

  const runFullAnalysis = async (lat: number, lon: number) => {
    setLoading(true);
    setAlerts([]);
    setData(null);
    setAqi(null);
    
    try {
      // 1. جلب بيانات الطقس المتقدمة (Open-Meteo)
      const params = [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
        'precipitation', 'weather_code', 'pressure_msl', 'surface_pressure',
        'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
        'dew_point_2m', 'cape', 'cloud_cover'
      ].join(',');

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${params}&timezone=auto`
      );
      const weatherJson = await weatherRes.json();
      
      if(weatherJson.current) {
        setData(weatherJson.current);
        generateAlerts(weatherJson.current);
      }

      // 2. جلب جودة الهواء (WAQI) - استغلال الكنز
      const airData = await fetchAirQuality(lat, lon);
      setAqi(airData);

    } catch (err) {
      console.error("Analysis Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (current: any) => {
    const newAlerts = [];
    if (current.cape > 1000) newAlerts.push("طاقة حمل عالية (خطر عواصف)");
    if (current.wind_gusts_10m > 50) newAlerts.push("هبات رياح عنيفة");
    const dewDiff = current.temperature_2m - current.dew_point_2m;
    if (dewDiff < 1 && dewDiff > 0) newAlerts.push("ضباب كثيف محتمل");
    if (current.apparent_temperature > 40) newAlerts.push("إجهاد حراري");
    setAlerts(newAlerts);
  };

  const getWindDirection = (degree: number) => {
    const sectors = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'];
    return sectors[(Math.round(degree / 45) % 8)];
  };

  if (!position) return null;

  return (
    <Popup 
      position={position} 
      eventHandlers={{
        remove: () => {
          setPosition(null);
          setData(null);
          setAqi(null);
        }
      }}
    >
      <div className="min-w-[280px] font-sans text-right" dir="rtl">
        {/* هيدر التقرير */}
        <div className="bg-slate-900 text-white p-3 rounded-t-lg -m-[1px] mb-2 flex justify-between items-center">
          <span className="font-bold text-sm flex items-center gap-2">
            <Activity className="text-blue-400" size={16}/> 
            تقرير المختبر
          </span>
          <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded-full">مباشر</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-500 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">تحليل الغلاف الجوي...</span>
          </div>
        ) : data ? (
          <div className="space-y-2 p-1">
            
            {/* الإنذارات */}
            {alerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <h4 className="text-red-700 font-bold text-xs flex items-center gap-1 mb-1">
                  <AlertTriangle size={12}/> تنبيهات النظام:
                </h4>
                <ul className="text-[10px] text-red-600 list-disc list-inside">
                  {alerts.map((alert, i) => <li key={i}>{alert}</li>)}
                </ul>
              </div>
            )}

            {/* صف جودة الهواء (جديد) */}
            {aqi && (
               <div className={`p-2 rounded border flex justify-between items-center ${aqi.aqi > 100 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                 <div className="flex items-center gap-2">
                   <Factory size={16} className={aqi.aqi > 100 ? "text-orange-500" : "text-green-500"}/>
                   <div>
                     <div className="text-[10px] text-slate-500">جودة الهواء</div>
                     <div className="font-bold text-slate-700 text-xs">{aqi.dominentpol}</div>
                   </div>
                 </div>
                 <div className="text-center">
                    <div className="font-bold text-xl">{aqi.aqi}</div>
                    <div className="text-[9px] text-slate-400">AQI</div>
                 </div>
               </div>
            )}

            {/* شبكة البيانات */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <div className="text-slate-500 mb-1 flex items-center gap-1"><Thermometer size={12}/> المحسوسة</div>
                <div className="font-bold text-lg">{data.apparent_temperature}°</div>
                <div className="text-[9px] text-slate-400">الفعلي: {data.temperature_2m}°</div>
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <div className="text-slate-500 mb-1 flex items-center gap-1"><Droplets size={12}/> الرطوبة</div>
                <div className="font-bold text-lg text-blue-600">{data.relative_humidity_2m}%</div>
                <div className="text-[9px] text-slate-400">الندى: {data.dew_point_2m}°</div>
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <div className="text-slate-500 mb-1 flex items-center gap-1"><Wind size={12}/> الرياح</div>
                <div className="font-bold text-lg">{data.wind_speed_10m} <span className="text-[9px]">km/h</span></div>
                <div className="text-[9px] text-slate-400 flex items-center gap-1">
                   {getWindDirection(data.wind_direction_10m)}
                   <Navigation size={10} style={{ transform: `rotate(${data.wind_direction_10m}deg)` }}/>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <div className="text-slate-500 mb-1 flex items-center gap-1"><Gauge size={12}/> الضغط</div>
                <div className="font-bold text-lg text-purple-700">{data.surface_pressure}</div>
                <div className="text-[9px] text-slate-400">hPa</div>
              </div>
            </div>

            {/* مؤشر العواصف */}
            <div className="bg-blue-50/50 p-2 rounded border border-blue-100 text-xs flex justify-between items-center">
               <span className="flex items-center gap-1 text-slate-600"><CloudLightning size={12}/> طاقة العواصف (CAPE)</span>
               <span className={`font-mono font-bold ${data.cape > 1000 ? 'text-red-600' : 'text-slate-700'}`}>{data.cape}</span>
            </div>

          </div>
        ) : (
          <div className="text-red-500 text-center text-xs p-4">فشل الاتصال بالمختبر</div>
        )}
      </div>
    </Popup>
  );
}