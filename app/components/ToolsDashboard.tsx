'use client';
import React, { useState, useEffect } from 'react';
import { initToolsEngine, getAllTools, loadTool } from '../core/engine/tool_loader';
import { Server, Download, Check, RefreshCw, Database, Brain, Map as MapIcon } from 'lucide-react';

export default function ToolsDashboard() {
  const [tools, setTools] = useState<any[]>([]);
  const [active, setActive] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      await initToolsEngine();
      setTools(getAllTools());
      setLoading(false);
    };
    boot();
  }, []);

  const handleActivate = async (id: string) => {
    setStatus(`جاري تحميل ${id}...`);
    await loadTool(id);
    setActive(prev => new Set(prev).add(id));
    setStatus("تم التفعيل بنجاح ✅");
    setTimeout(() => setStatus(""), 2000);
  };

  const getIcon = (cat: string) => {
    if (cat === 'ai') return <Brain className="w-4 h-4 text-purple-400"/>;
    if (cat === 'map') return <MapIcon className="w-4 h-4 text-blue-400"/>;
    if (cat === 'data') return <Database className="w-4 h-4 text-green-400"/>;
    return <Server className="w-4 h-4 text-slate-400"/>;
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-3xl border border-white/10 mt-8 shadow-2xl animate-in slide-in-from-bottom">
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <h2 className="text-lg font-bold flex items-center gap-2"><Server className="w-5 h-5 text-blue-500"/> مخزن الأدوات الذكي</h2>
        <span className="text-[10px] bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full border border-blue-500/30">{tools.length} أداة</span>
      </div>

      {loading && <div className="text-center py-10 text-slate-500"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2"/> جاري استكشاف الموارد...</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-64 overflow-y-auto pr-2 custom-scrollbar">
        {tools.map((t) => (
          <button 
            key={t.id}
            onClick={() => handleActivate(t.id)}
            disabled={active.has(t.id)}
            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between group ${
              active.has(t.id) 
                ? 'bg-green-900/20 border-green-500/30 cursor-default' 
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`p-2 rounded-lg ${active.has(t.id) ? 'bg-green-500/20' : 'bg-slate-800'}`}>
                {getIcon(t.category)}
              </div>
              <div className="text-right overflow-hidden">
                <h3 className="font-bold text-xs truncate w-24">{t.name}</h3>
                <p className="text-[9px] text-slate-400 truncate">{t.category.toUpperCase()}</p>
              </div>
            </div>
            
            <div className="pl-2">
              {active.has(t.id) ? <Check className="w-4 h-4 text-green-500"/> : <Download className="w-4 h-4 text-slate-500 group-hover:text-white"/>}
            </div>
          </button>
        ))}
      </div>
      
      {status && (
        <div className="mt-4 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg text-center text-xs text-blue-300 animate-pulse">
          {status}
        </div>
      )}
    </div>
  );
}
