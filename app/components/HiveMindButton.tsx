'use client';
import React, { useState, useEffect } from 'react';
import { Megaphone, ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function HiveMindButton({ city }: { city: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [voted, setVoted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const f = async () => { try { const { count: c } = await supabase.from('weather_reports').select('*', { count: 'exact', head: true }).eq('city', city); if(c) setCount(c); } catch {} };
    f();
  }, [city]);

  const h = async (t: string) => { setVoted(true); setIsOpen(false); try { await supabase.from('weather_reports').insert([{ city, condition: t }]); } catch {} };

  if (voted) return <div className="fixed bottom-24 left-4 z-50 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg text-xs">تم الإبلاغ!</div>;

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 left-4 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-xl"><Megaphone className="w-6 h-6"/></button>
      {isOpen && (
        <div className="fixed bottom-40 left-4 z-50 bg-white rounded-2xl shadow-2xl p-4 w-64">
          <div className="grid grid-cols-2 gap-2">
            {['مشمس', 'غائم', 'مطر', 'عاصف'].map(t => <button key={t} onClick={() => h(t)} className="p-2 bg-slate-50 rounded-xl text-xs font-bold">{t}</button>)}
          </div>
        </div>
      )}
    </>
  );
}
