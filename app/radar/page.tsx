import dynamic from 'next/dynamic';
const MapComponent = dynamic(() => import('../Map'), { ssr: false }); // نستورد الخريطة هنا

export default function RadarPage() {
  return (
    <div className="h-screen w-full relative">
       {/* سنمرر إحداثيات افتراضية مؤقتاً */}
       <MapComponent lat={33.5731} lon={-7.5898} city="الرادار العالمي" />
       <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg">
         <h1 className="font-bold text-slate-800">مركز القيادة والرصد</h1>
       </div>
    </div>
  );
}
