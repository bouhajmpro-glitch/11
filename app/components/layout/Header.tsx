'use client';

import React from 'react';
import { Menu, MapPin } from 'lucide-react';

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-[500] p-4 pointer-events-none">
      <div className="flex items-center justify-between pointer-events-auto">
        {/* زر القائمة الجانبية */}
        <button className="p-3 bg-slate-900/80 backdrop-blur-md text-white rounded-xl shadow-lg border border-slate-700 hover:bg-slate-800 transition-colors">
          <Menu className="w-6 h-6" />
        </button>

        {/* عنوان الصفحة والموقع */}
        <div className="bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-xl border border-slate-700 shadow-lg flex items-center gap-3">
          <h1 className="text-white font-bold text-lg hidden md:block">مركز المراقبة الجوية</h1>
          <div className="h-4 w-[1px] bg-slate-600 hidden md:block"></div>
          <div className="flex items-center gap-2 text-blue-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium text-slate-200">المغرب، الدار البيضاء</span>
          </div>
        </div>

        {/* مساحة فارغة للتوازن أو زر آخر */}
        <div className="w-12"></div> 
      </div>
    </header>
  );
}