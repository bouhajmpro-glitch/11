'use client';
import React, { useEffect, useRef } from 'react';
import { X, Wind, CloudRain, Thermometer, Zap, Gauge, Navigation, Activity } from 'lucide-react';
import { WeatherData } from '../core/weather/types';

interface Props {
  data: WeatherData;
  loading: boolean;
  onClose: () => void;
}

// تغيير الاسم هنا إلى RadarPanel
export default function RadarPanel({ data, loading, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!data || loading || !canvasRef.current) return;
    
    const Chart = (window as any).Chart;
    if (!Chart) return;

    const ctx = canvasRef.current.getContext('2d');
    
    if ((window as any).radarChartInstance) {
      (window as any).radarChartInstance.destroy();
    }

    (window as any).radarChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.hourly.time.slice(0, 12).map(t => new Date(t).getHours() + ':00'),
        datasets: [
          {
            label: 'الحرارة (°C)',
            data: data.hourly.temp.slice(0, 12),
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
            fill: true
          },
          {
            label: 'أمطار (mm)',
            data: data.hourly.rainAmount.slice(0, 12),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            type: 'bar',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#64748b', font: {size: 10} }, grid: { display: false } },
          y: { type: 'linear', display: false, position: 'left' },
          y1: { type: 'linear', display: false, position: 'right', grid: { display: false } },
        }
      }
    });

  }, [data, loading]);

  if (loading) return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center shadow-2xl h-64 flex flex-col items-center justify-center ring-1 ring-white/10">
      <Activity className="animate-spin text-blue-500 mb-2" size={32} />
      <span className="text-slate-400 text-xs animate-pulse">جاري تحليل بيانات الحي السكني...</span>
    </div>
  );

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 text-white shadow-2xl ring-1 ring-white/10">
      
      <div className="flex justify-between items-start mb-4 pb-3 border-b border-white/5">
        <div>
          <h3 className="text-md font-bold flex items-center gap-2 text-blue-100">
            <Navigation className="text-blue-500" size={16} />
            تحليل الموقع الدقيق
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 font-mono leading-tight max-w-[200px] truncate">
            {data.city}, {data.country}
          </p>
        </div>
        <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition text-slate-400 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white/5 p-2.5 rounded-xl flex items-center gap-2 border border-white/5 hover:bg-white/10 transition">
          <Wind className="text-teal-400" size={18} />
          <div>
            <div className="text-[9px] text-slate-400">الرياح</div>
            <div className="font-bold text-sm">{data.windSpeed} <span className="text-[9px] text-slate-500">km/h</span></div>
          </div>
        </div>
        <div className="bg-white/5 p-2.5 rounded-xl flex items-center gap-2 border border-white/5 hover:bg-white/10 transition">
          <Gauge className="text-purple-400" size={18} />
          <div>
            <div className="text-[9px] text-slate-400">الضغط</div>
            <div className="font-bold text-sm">{data.pressure} <span className="text-[9px] text-slate-500">hPa</span></div>
          </div>
        </div>
        <div className="bg-white/5 p-2.5 rounded-xl flex items-center gap-2 border border-white/5 hover:bg-white/10 transition">
          <Zap className="text-yellow-400" size={18} />
          <div>
            <div className="text-[9px] text-slate-400">الطاقة</div>
            <div className="font-bold text-sm">{data.cape || 0} <span className="text-[9px] text-slate-500">J/kg</span></div>
          </div>
        </div>
        <div className="bg-white/5 p-2.5 rounded-xl flex items-center gap-2 border border-white/5 hover:bg-white/10 transition">
          <CloudRain className="text-blue-400" size={18} />
          <div>
            <div className="text-[9px] text-slate-400">المطر</div>
            <div className="font-bold text-sm">{data.rainAmount} <span className="text-[9px] text-slate-500">mm</span></div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/50 rounded-2xl p-2 border border-white/5 h-40">
        <canvas ref={canvasRef}></canvas>
      </div>
      
      <div className="mt-2 text-center">
        <span className="text-[9px] text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          تم التحليل بواسطة 6 نماذج عالمية
        </span>
      </div>
    </div>
  );
}