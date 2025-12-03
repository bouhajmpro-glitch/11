'use client';
import React, { useState, useEffect } from 'react';
import { Activity, Rocket, Globe, Volume2, StopCircle, Radio, X, Microscope } from 'lucide-react';
import { getGlobalHazards, Hazard } from '../hazards';

const NewsModal = ({ hazard, onClose }: { hazard: Hazard, onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-md p-6">
      <h2 className="text-xl font-bold mb-2">{hazard.title}</h2>
      <p className="text-slate-600 text-sm">{hazard.details}</p>
      <button onClick={onClose} className="mt-4 w-full bg-slate-900 text-white py-2 rounded-xl">إغلاق</button>
    </div>
  </div>
);

export default function HazardTicker() {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [visible, setVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selected, setSelected] = useState<Hazard | null>(null);

  useEffect(() => { getGlobalHazards().then(setHazards); }, []);

  if (!visible || hazards.length === 0) return null;

  const speak = () => {
    if (isPlaying) { window.speechSynthesis.cancel(); setIsPlaying(false); return; }
    setIsPlaying(true);
    const u = new SpeechSynthesisUtterance("موجز.. " + hazards.map(h => h.title).join(". "));
    u.lang = 'ar-SA'; u.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(u);
  };

  return (
    <>
      {selected && <NewsModal hazard={selected} onClose={() => setSelected(null)} />}
      <div className="bg-slate-900 text-white p-2 relative z-50 border-b border-white/10">
        <div className="flex justify-between items-center gap-3">
          <button onClick={speak} className="p-1">{isPlaying ? <StopCircle className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}</button>
          <div className="flex-1 overflow-hidden flex h-6 relative">
             <div className="absolute right-0 z-10 bg-slate-900 pl-2"><Radio className="w-3 h-3 inline ml-1"/> موجز</div>
             <div className="flex gap-8 animate-marquee whitespace-nowrap pr-16">
               {hazards.map(h => <button key={h.id} onClick={() => setSelected(h)} className="text-xs hover:underline">{h.title}</button>)}
             </div>
          </div>
          <button onClick={() => setVisible(false)}><X className="w-4 h-4" /></button>
        </div>
      </div>
    </>
  );
}
