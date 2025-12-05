'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GridDataPoint } from '../core/weather/gridApi';

interface Props {
  map: any;
  data: GridDataPoint[];
  type: 'temp' | 'pressure' | 'clouds';
}

export default function HeatmapLayer({ map, data, type }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // نظام ألوان Windy
  const getColor = (val: number) => {
    if (type === 'temp') {
      if (val < 0) return `rgba(255, 255, 255, 0.6)`; // ثلوج
      if (val < 10) return `rgba(0, 100, 255, 0.5)`;  // بارد
      if (val < 20) return `rgba(0, 200, 0, 0.5)`;    // ربيع
      if (val < 30) return `rgba(255, 165, 0, 0.5)`;  // حار
      return `rgba(255, 0, 0, 0.6)`;                  // حار جداً
    }
    if (type === 'pressure') {
      // الضغط: بنفسجي للمنخفض، أزرق للمرتفع
      const alpha = Math.max(0.2, Math.min(0.8, (val - 980) / 60)); 
      return `rgba(100, 0, 200, ${alpha})`;
    }
    if (type === 'clouds') {
      // السحب: أبيض شفاف حسب الكثافة
      return `rgba(200, 200, 200, ${val / 100})`;
    }
    return 'rgba(0,0,0,0)';
  };

  useEffect(() => {
    if (!map || !data || data.length === 0 || typeof window === 'undefined') return;

    const L_global = (window as any).L;
    if (!L_global) return;

    // 1. إنشاء طبقة العرض (Pane)
    const paneName = 'heatmapPane';
    let pane = map.getPane(paneName);
    
    if (!pane) {
      pane = map.createPane(paneName);
      pane.style.zIndex = '350'; // فوق الخريطة، تحت الرياح
    }

    if (!pane) return;

    // إعداد الكانفاس
    const canvas = L_global.DomUtil.create('canvas', 'leaflet-heatmap-layer');
    canvas.style.pointerEvents = 'none';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    // 2. دالة الرسم
    const draw = () => {
      if (!map || !canvasRef.current) return;
      const cvs = canvasRef.current;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;

      const size = map.getSize();
      const pixelRatio = window.devicePixelRatio || 1;

      // ضبط الدقة
      cvs.width = size.x * pixelRatio;
      cvs.height = size.y * pixelRatio;
      cvs.style.width = `${size.x}px`;
      cvs.style.height = `${size.y}px`;

      ctx.scale(pixelRatio, pixelRatio);
      ctx.clearRect(0, 0, size.x, size.y);
      
      // **السر:** تمويه قوي (Blur) لدمج الدوائر وجعلها كالسائل
      ctx.filter = 'blur(40px)';

      data.forEach(point => {
        const latLng = new L_global.LatLng(point.lat, point.lng);
        const pixel = map.latLngToContainerPoint(latLng);

        // رسم دائرة كبيرة لكل نقطة بيانات
        // نتحقق أنها داخل الشاشة للأداء
        if (pixel.x > -100 && pixel.x < size.x + 100 && pixel.y > -100 && pixel.y < size.y + 100) {
            ctx.beginPath();
            ctx.arc(pixel.x, pixel.y, 80, 0, 2 * Math.PI); // نصف قطر كبير للتداخل
            ctx.fillStyle = getColor(point.value);
            ctx.fill();
        }
      });
    };

    // الرسم الأولي
    draw();

    // إعادة الرسم عند الحركة
    map.on('move', draw);
    map.on('resize', draw);
    map.on('zoom', draw);

    return () => {
      map.off('move', draw);
      map.off('resize', draw);
      map.off('zoom', draw);
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
      canvasRef.current = null;
    };
  }, [map, data, type]);

  return null;
}