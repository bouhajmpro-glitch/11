'use client';
import React, { useState, useEffect } from 'react';
import { initToolsEngine, getAllTools, loadTool } from '../core/engine/tool_loader';
import { Server, Download, Check, RefreshCw } from 'lucide-react';

export default function ToolsDashboard() {
  const [tools, setTools] = useState<any[]>([]);
  const [active, setActive] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");

  // عند الفتح: استيقظ يا محرك وابحث عن الأدوات
  useEffect(() => {
    const boot = async () => {
      await initToolsEngine(); // قراءة ملف JSON
      setTools(getAllTools()); // جلب القائمة المكتشفة
    };
    boot();
  }, []);

  const handleActivate = async (id: string) => {
    setStatus(`Loading ${id}...`);
    await loadTool(id);
    setActive(prev => new Set(prev).add(id));
    setStatus("Ready");
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-3xl border border-white/10 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2"><Server className="w-6 h-6 text-blue-500"/> المحرك الديناميكي</h2>
        <span className="text-xs bg-blue-900 px-3 py-1 rounded-full">{tools.length} أداة مكتشفة</span>
      </div>

      {tools.length === 0 && <div className="text-center py-10 text-slate-500"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2"/> جاري استكشاف الأدوات...</div>}

      <div className="grid grid-cols-2 gap-3 h-64 overflow-y-auto pr-2 custom-scrollbar">
        {tools.map((t) => (
          <button 
            key={t.id}
            onClick={() => handleActivate(t.id)}
            disabled={active.has(t.id)}
            className={`p-3 rounded-xl border text-right transition-all ${active.has(t.id) ? 'bg-green-900/30 border-green-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">{t.category}</span>
              {active.has(t.id) ? <Check className="w-4 h-4 text-green-500"/> : <Download className="w-4 h-4 text-slate-500"/>}
            </div>
            <h3 className="font-bold text-sm">{t.name}</h3>
          </button>
        ))}
      </div>
      
      {status && <div className="mt-4 text-center text-xs text-blue-300 animate-pulse">{status}</div>}
    </div>
  );
}
