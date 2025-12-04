'use client';
import React, { useState } from 'react';
import { Navigation, Star } from 'lucide-react';

interface Props {
  city: string;
  temp: number;
  icon: string;
  desc: string;
  summary: string;
}

export const MainForecast = ({ city, temp, icon, desc, summary }: Props) => {
  const [rating, setRating] = useState(0);

  return (
    <div className="text-center py-6 mb-8">
      <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full text-sm text-blue-200 border border-white/10 mb-6 shadow-lg">
        <Navigation size={14} /> {city} • مباشر
      </div>
      <div className="flex flex-col items-center justify-center">
        <img src={icon} alt="icon" className="w-20 h-20 drop-shadow-lg" />
        <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tighter -mt-4">
          {Math.round(temp)}°
        </h1>
      </div>
      <p className="text-2xl text-white font-medium mt-2">{desc}</p>
      <div className="mt-6 bg-white/5 p-5 rounded-2xl border border-white/10 max-w-2xl mx-auto backdrop-blur-sm text-center">
        <p className="text-white/80 leading-relaxed text-sm">{summary}</p>
      </div>
      <div className="mt-4 flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => setRating(star)} className={`${rating >= star ? 'text-yellow-400' : 'text-white/10'}`}>
            <Star size={20} fill="currentColor" />
          </button>
        ))}
      </div>
    </div>
  );
};