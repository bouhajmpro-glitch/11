'use client';
import React, { useState, useEffect } from 'react';
import { Activity, Rocket, Microscope, Globe, Volume2, StopCircle, Radio, X } from 'lucide-react';
import { getGlobalHazards, Hazard } from '../hazards';

const NewsModal = ({ hazard, onClose }: { hazard: Hazard, onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
      <div className="p-4 bg-slate-800 text-white flex justify-between"><h3 className="font-bold flex gap-2"><Activity className="w-4 h-4"/> التفاصيل</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div>
      <div className="p-6"><h2 className="text-xl font-bold mb-2">{hazard.title}</h2><p className="text-slate-600 text-sm">{hazard.details}</p></div>
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

  const Icon = isPlaying ? StopCircle : Volume2;

  return (
    <>
      {selected && <NewsModal hazard={selected} onClose={() => setSelected(null)} />}
      <div className="bg-slate-900 text-white p-2 relative z-50 border-b border-white/10 overflow-hidden">
        <div className="flex justify-between items-center gap-3">
          <button onClick={speak}><Icon className="w-4 h-4" /></button>
          <div className="flex-1 overflow-hidden flex h-6 relative">
             <div className="absolute right-0 z-10 bg-slate-900 pl-2"><Radio className="w-3 h-3 inline ml-1"/> موجز</div>
             <div className="flex gap-8 animate-marquee whitespace-nowrap pr-16 items-center">
               {hazards.map(h => <button key={h.id} onClick={() => setSelected(h)} className="text-xs hover:underline">{h.title}</button>)}
             </div>
          </div>
          <button onClick={() => setVisible(false)}><X className="w-4 h-4" /></button>
        </div>
      </div>
    </>
  );
}
