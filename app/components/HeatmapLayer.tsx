'use client';
import { useEffect, useRef } from 'react';
import { GridDataPoint } from '../core/weather/api';

interface Props {
  map: any;
  data: GridDataPoint[];
  type: 'temp' | 'pressure' | 'clouds';
}

export default function HeatmapLayer({ map, data, type }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // دالة تلوين القيم (Windy Style)
  const getColor = (val: number) => {
    if (type === 'temp') {
      if (val < 0) return `rgba(255, 255, 255, 0.6)`;
      if (val < 10) return `rgba(0, 100, 255, 0.6)`;
      if (val < 20) return `rgba(0, 255, 0, 0.6)`;
      if (val < 30) return `rgba(255, 165, 0, 0.7)`;
      return `rgba(255, 0, 0, 0.7)`;
    }
    if (type === 'pressure') {
      const alpha = (val - 980) / 60; 
      return `rgba(100, 0, 200, ${0.2 + alpha * 0.5})`;
    }
    if (type === 'clouds') {
      return `rgba(200, 200, 200, ${val / 100})`;
    }
    return 'rgba(0,0,0,0)';
  };

  useEffect(() => {
    if (!map || !data || data.length === 0 || typeof window === 'undefined') return;

    const L = (window as any).L;
    if (!L) return;

    // 1. إنشاء طبقة الكانفاس
    const paneName = 'heatmapPane';
    let pane = map.getPane(paneName);
    
    if (!pane) {
      pane = map.createPane(paneName);
      pane.style.zIndex = '350'; // فوق الخلفية
    }

    if (!pane) return;

    const canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer');
    canvas.style.pointerEvents = 'none'; // السماح بالنقر عبر الطبقة
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    // 2. دالة الرسم
    const draw = () => {
      if (!map || !canvas) return;

      const size = map.getSize();
      const pixelRatio = window.devicePixelRatio || 1;
      
      canvas.width = size.x * pixelRatio;
      canvas.height = size.y * pixelRatio;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(pixelRatio, pixelRatio);
      ctx.clearRect(0, 0, size.x, size.y);
      
      // التنعيم (Blur) هو السر لجعل النقاط تبدو كسائل متصل
      ctx.filter = 'blur(25px)';

      data.forEach(point => {
        const latLng = new L.LatLng(point.lat, point.lng);
        const pixel = map.latLngToContainerPoint(latLng);

        // رسم دائرة ملونة لكل نقطة
        // نتحقق أولاً أنها داخل الشاشة للأداء
        if (pixel.x > -100 && pixel.x < size.x + 100 && pixel.y > -100 && pixel.y < size.y + 100) {
            ctx.beginPath();
            ctx.arc(pixel.x, pixel.y, 70, 0, 2 * Math.PI); // نصف قطر كبير للمزج
            ctx.fillStyle = getColor(point.value);
            ctx.fill();
        }
      });
    };

    // الرسم الأولي
    draw();

    // إعادة الرسم عند التحريك والتكبير
    map.on('move', draw);
    map.on('resize', draw);
    map.on('zoom', draw);

    // التنظيف
    return () => {
      map.off('move', draw);
      map.off('resize', draw);
      map.off('zoom', draw);
      
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      canvasRef.current = null;
    };
  }, [map, data, type]);

  return null;
}