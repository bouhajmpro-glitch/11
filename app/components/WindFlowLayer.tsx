'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function WindGLLayer() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brainData, setBrainData] = useState<any>(null);

  // 1. الاتصال بـ "العقل السحابي" بدلاً من المصدر الخام
  useEffect(() => {
    const fetchBrainData = async () => {
      const center = map.getCenter();
      try {
        // نطلب من السيرفر التحليل (POST request)
        const res = await fetch('/api/weather-brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: center.lat, lon: center.lng })
        });
        const json = await res.json();
        setBrainData(json);
      } catch (e) {
        console.error("Brain Connection Failed:", e);
      }
    };
    
    fetchBrainData();
    map.on('moveend', fetchBrainData);
    return () => { map.off('moveend', fetchBrainData); };
  }, [map]);

  // 2. الرسم عالي الأداء (High Performance Rendering)
  useEffect(() => {
    if (!brainData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    // محاولة استخدام webgl إن أمكن، أو التراجع لـ 2d
    const ctx = canvas.getContext('2d', { alpha: true }); 
    if (!ctx) return;

    const updateCanvasSize = () => {
      const size = map.getSize();
      // مضاعفة الدقة للشاشات عالية الكثافة (Retina/Mobile)
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size.x * dpr;
      canvas.height = size.y * dpr;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();
    map.on('resize', updateCanvasSize);

    // --- نظام الجسيمات الخفيف (Lightweight Particles) ---
    // عدد جسيمات أقل لكن بحركة أذكى
    const particleCount = 600;
    const particles = new Float32Array(particleCount * 3); // [x, y, age]
    
    // تهيئة عشوائية
    for (let i = 0; i < particleCount; i++) {
      particles[i * 3] = Math.random() * map.getSize().x;
      particles[i * 3 + 1] = Math.random() * map.getSize().y;
      particles[i * 3 + 2] = Math.random() * 100; // Age
    }

    let animationId: number;

    const render = () => {
      // 1. مسح ناعم (Fade effect)
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.93)'; // ذيل أطول
      ctx.fillRect(0, 0, map.getSize().x, map.getSize().y);
      
      // 2. إعدادات الرسم
      ctx.globalCompositeOperation = 'lighter';
      // استخدام اللون الذي قرره السيرفر (أحمر للخطر، أزرق للهدوء)
      const baseColor = brainData.analysis.score > 50 ? '255, 100, 100' : '200, 230, 255';
      ctx.strokeStyle = `rgba(${baseColor}, 0.8)`;
      ctx.lineWidth = 1.5;
      
      const wind = brainData.visuals.wind;
      // تسريع الحركة قليلاً للمظهر الجمالي
      const u = wind.u / 2; 
      const v = -wind.v / 2; // قلب المحور Y

      ctx.beginPath();
      for (let i = 0; i < particleCount; i++) {
        const x = particles[i * 3];
        const y = particles[i * 3 + 1];
        
        ctx.moveTo(x, y);
        const nextX = x + u;
        const nextY = y + v;
        ctx.lineTo(nextX, nextY);

        // تحديث الموقع
        particles[i * 3] = nextX;
        particles[i * 3 + 1] = nextY;
        particles[i * 3 + 2]++; // Age

        // إعادة التدوير (Reset)
        const width = map.getSize().x;
        const height = map.getSize().y;
        
        if (particles[i * 3 + 2] > 60 || nextX < 0 || nextX > width || nextY < 0 || nextY > height) {
           particles[i * 3] = Math.random() * width;
           particles[i * 3 + 1] = Math.random() * height;
           particles[i * 3 + 2] = 0;
        }
      }
      ctx.stroke();
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      map.off('resize', updateCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [map, brainData]);

  // موقع الكانفاس
  const pixelOrigin = map.getPixelOrigin();
  // @ts-ignore
  const transform = L.DomUtil.getTranslateString(pixelOrigin);

  return (
    <canvas 
      ref={canvasRef}
      className="leaflet-zoom-animated"
      style={{
        position: 'absolute', left: 0, top: 0,
        zIndex: 400, pointerEvents: 'none',
        transform: transform
      }}
    />
  );
}