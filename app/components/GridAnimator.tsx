'use client';
import { useEffect, useRef } from 'react';

interface Props {
  map: any;
  type: 'temp' | 'pressure' | 'clouds';
  dataSeries: any[]; // سلسلة البيانات الزمنية الكاملة
  currentIndex: number;
}

export default function GridAnimator({ map, type, dataSeries, currentIndex }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getTempColor = (t: number) => {
    if (t < 0) return 'rgba(255,255,255,0.7)';
    if (t < 10) return 'rgba(0,100,255,0.6)';
    if (t < 20) return 'rgba(0,200,50,0.6)';
    if (t < 30) return 'rgba(255,150,0,0.6)';
    return 'rgba(255,0,0,0.6)';
  };

  const getPressureColor = (p: number) => {
    const alpha = (p - 980) / 60;
    return `rgba(100,0,200,${0.2 + alpha * 0.5})`;
  };

  useEffect(() => {
    if (!map || !dataSeries || dataSeries.length === 0) return;
    const L = (window as any).L;

    // 1. إعداد الـ Pane والكانفاس
    if (!map.getPane('animGridPane')) {
      map.createPane('animGridPane');
      map.getPane('animGridPane').style.zIndex = 350;
    }

    if (!canvasRef.current) {
      const canvas = L.DomUtil.create('canvas', 'anim-grid-layer');
      canvas.style.pointerEvents = 'none';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      map.getPane('animGridPane').appendChild(canvas);
      canvasRef.current = canvas;
    }

    const draw = () => {
      const cvs = canvasRef.current;
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      const size = map.getSize();
      
      cvs.width = size.x;
      cvs.height = size.y;
      ctx?.clearRect(0, 0, size.x, size.y);
      if(ctx) ctx.filter = 'blur(30px)'; // تنعيم ليبدو كسائل

      // جلب بيانات الساعة الحالية
      const currentFrame = dataSeries[currentIndex];
      if (!currentFrame || !currentFrame.grid) return;

      currentFrame.grid.forEach((pt: any) => {
        const point = map.latLngToContainerPoint([pt.lat, pt.lng]);
        
        // رسم فقط إذا كان داخل الشاشة
        if (point.x > -100 && point.x < size.x + 100 && point.y > -100 && point.y < size.y + 100) {
          ctx?.beginPath();
          ctx?.arc(point.x, point.y, 80, 0, 2 * Math.PI);
          
          if (type === 'temp') ctx!.fillStyle = getTempColor(pt.temp);
          else if (type === 'pressure') ctx!.fillStyle = getPressureColor(pt.pressure);
          else if (type === 'clouds') ctx!.fillStyle = `rgba(200,200,200,${pt.clouds/100})`;
          
          ctx?.fill();
        }
      });
    };

    draw();

    // إعادة الرسم عند التحريك
    map.on('move', draw);
    map.on('zoom', draw);

    return () => {
      map.off('move', draw);
      map.off('zoom', draw);
    };
  }, [map, dataSeries, currentIndex, type]);

  // تنظيف نهائي
  useEffect(() => {
    return () => {
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
      }
    };
  }, []);

  return null;
}