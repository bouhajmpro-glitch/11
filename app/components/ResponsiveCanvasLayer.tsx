'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GridDataPoint } from '../core/weather/gridApi';

interface Props {
  // استخدام L.Map بدلاً من any لضبط الأنواع بشكل أفضل
  map: L.Map | null; 
  data: GridDataPoint[];
  type: 'temp' | 'pressure' | 'clouds';
}

export default function ResponsiveCanvasLayer({ map, data, type }: Props) {
  // السماح بالقيمة null للمرجع
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
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
    // فحوصات الأمان الأساسية
    if (!map || !data || data.length === 0 || typeof window === 'undefined') return;

    // التأكد من وجود مكتبة Leaflet
    const L_global = (window as any).L;
    if (!L_global) return;

    const paneName = 'responsiveCanvasPane';
    
    // 1. التأكد من وجود الـ Pane أو إنشائه بأمان
    let pane = map.getPane(paneName);
    if (!pane) {
      pane = map.createPane(paneName);
      // وضعها فوق الخلفية ولكن تحت الطرق والتسميات
      pane.style.zIndex = '350'; 
    }

    // إذا فشل إنشاء الـ Pane لسبب ما، نخرج
    if (!pane) return; 

    // 2. إنشاء الكانفاس وإضافته
    const canvas = L_global.DomUtil.create('canvas', 'leaflet-responsive-layer');
    canvas.style.pointerEvents = 'none'; // السماح بمرور النقرات
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    
    pane.appendChild(canvas);
    canvasRef.current = canvas;

    // 3. دالة الرسم المحسنة
    const draw = () => {
      // تأكد من وجود العناصر قبل الرسم
      if (!map || !canvasRef.current) return;
      const canvasEl = canvasRef.current;

      const size = map.getSize();
      // استخدام pixelRatio للشاشات عالية الدقة (Retina)
      const pixelRatio = window.devicePixelRatio || 1;
      
      // ضبط الحجم الفعلي للكانفاس بناءً على دقة الشاشة
      canvasEl.width = size.x * pixelRatio;
      canvasEl.height = size.y * pixelRatio;
      // ضبط الحجم الظاهري CSS
      canvasEl.style.width = `${size.x}px`;
      canvasEl.style.height = `${size.y}px`;
      
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;

      // مواءمة الرسم مع دقة الشاشة
      ctx.scale(pixelRatio, pixelRatio);
      // مسح الكانفاس بالكامل قبل إعادة الرسم
      ctx.clearRect(0, 0, size.x, size.y);
      
      // تطبيق تأثير التنعيم (Blur) لتبدو مثل Windy
      ctx.filter = 'blur(25px)';

      // رسم كل نقطة بيانات
      data.forEach(point => {
        const latLng = new L_global.LatLng(point.lat, point.lng);
        // تحويل الإحداثيات الجغرافية إلى نقاط بكسل على الشاشة
        const pixel = map.latLngToContainerPoint(latLng);

        // تحسين الأداء: رسم النقاط التي داخل أو قريبة من الشاشة فقط
        const buffer = 100; // هامش إضافي
        if (pixel.x > -buffer && pixel.x < size.x + buffer && pixel.y > -buffer && pixel.y < size.y + buffer) {
            ctx.beginPath();
            // رسم دائرة كبيرة متداخلة لخلق تأثير التدرج
            ctx.arc(pixel.x, pixel.y, 70, 0, 2 * Math.PI);
            ctx.fillStyle = getColor(point.value);
            ctx.fill();
        }
      });
    };

    // الرسم الأولي
    draw();

    // الاستماع لأحداث الخريطة لإعادة الرسم
    // نستمع لـ 'move' للحصول على تحديث فوري أثناء السحب
    map.on('move', draw);
    map.on('resize', draw);
    // أحداث الزوم تحتاج تعامل خاص أحياناً، لكن move يغطي أغلبها هنا

    // دالة التنظيف عند إزالة المكون أو تغيير البيانات
    return () => {
      map.off('move', draw);
      map.off('resize', draw);
      
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
      canvasRef.current = null;
    };
  }, [map, data, type]); // إعادة التنفيذ عند تغير الخريطة، البيانات، أو النوع

  return null;
}