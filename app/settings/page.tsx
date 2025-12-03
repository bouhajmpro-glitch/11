// app/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { User, Trash2, Shield, Bell, Moon, Server, Download, Check, RefreshCw, Database, Brain, Map as MapIcon } from 'lucide-react';
// استيراد الأدوات والأنواع
import { initToolsEngine, getAllTools, loadTool } from '../core/engine/tool_loader';
import { ToolDef } from '../core/config/tools_registry';

// --- مكون لوحة الأدوات (ToolsDashboard) ---
const ToolsDashboard = () => {
  const [tools, setTools] = useState<ToolDef[]>([]);
  const [active, setActive] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      await initToolsEngine(); // محاولة الاتصال بالسحابة
      // هنا السر: جلب القائمة الكاملة (التي تتضمن الـ 50+ أداة احتياطية)
      const all = getAllTools(); 
      setTools(all);
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
        <h2 className="text-lg font-bold flex items-center gap-2"><Server className="w-5 h-5 text-blue-500"/> مخزن الأدوات الشامل</h2>
        <span className="text-[10px] bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full border border-blue-500/30">{tools.length} أداة</span>
      </div>

      {loading && <div className="text-center py-10 text-slate-500"><RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2"/> جاري استكشاف الموارد...</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-96 overflow-y-auto pr-2 custom-scrollbar">
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
                <h3 className="font-bold text-xs truncate w-32">{t.name}</h3>
                <p className="text-[9px] text-slate-400 truncate">{t.category.toUpperCase()}</p>
              </div>
            </div>
            <div className="pl-2">
              {active.has(t.id) ? <Check className="w-4 h-4 text-green-500"/> : <Download className="w-4 h-4 text-slate-500 group-hover:text-white"/>}
            </div>
          </button>
        ))}
      </div>
      {status && <div className="mt-4 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg text-center text-xs text-blue-300 animate-pulse">{status}</div>}
    </div>
  );
};

// --- باقي الصفحة (الإعدادات العادية) ---
export default function SettingsPage() {
  const [name, setName] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('userName') || '';
    setName(savedName);
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setNotifications(true);
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    localStorage.setItem('userName', e.target.value);
  };

  const toggleNotifications = () => {
    if (!('Notification' in window)) return alert('المتصفح لا يدعم الإشعارات');
    if (!notifications) {
      Notification.requestPermission().then((p) => {
        if (p === 'granted') {
          setNotifications(true);
          new Notification("تم التفعيل ✅", { body: "ستصلك أهم التنبيهات." });
        } else alert('يجب السماح من المتصفح.');
      });
    } else setNotifications(false);
  };

  const clearData = () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('هل أنت متأكد؟')) { localStorage.clear(); location.href = '/'; }
  };

  return (
    <main className="min-h-screen p-4 pb-24 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8 mt-4">الإعدادات</h1>

      <div className="space-y-6">
        {/* 1. الملف الشخصي */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 mb-3 px-1">الملف الشخصي</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User className="w-6 h-6" /></div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 block mb-1">الاسم</label>
              <input type="text" placeholder="اسمك..." value={name} onChange={handleNameChange} className="w-full font-bold text-slate-800 outline-none" />
            </div>
          </div>
        </section>

        {/* 2. التفضيلات */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 mb-3 px-1">التحكم</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
            <div className="p-4 flex justify-between items-center">
              <div className="flex gap-3 items-center"><div className="p-2 bg-orange-50 rounded-lg text-orange-500"><Bell className="w-5 h-5"/></div><span className="font-medium text-slate-700">تنبيهات</span></div>
              <button onClick={toggleNotifications} className={`w-12 h-7 rounded-full p-1 transition-colors ${notifications ? 'bg-green-500' : 'bg-slate-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-[-20px]' : ''}`} /></button>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div className="flex gap-3 items-center"><div className="p-2 bg-purple-50 rounded-lg text-purple-500"><Moon className="w-5 h-5"/></div><span className="font-medium text-slate-700">مظلم</span></div>
              <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-7 rounded-full p-1 transition-colors ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-[-20px]' : ''}`} /></button>
            </div>
          </div>
        </section>

        {/* 3. لوحة الأدوات الكاملة */}
        <ToolsDashboard />

        {/* 4. الخطر */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 mb-3 px-1">المنطقة الخطرة</h2>
          <button onClick={clearData} className="w-full p-4 flex items-center gap-3 text-red-600 bg-white rounded-2xl border border-slate-100 hover:bg-red-50 transition-colors">
            <Trash2 className="w-5 h-5" /><span className="font-medium">تصفير التطبيق</span>
          </button>
        </section>

        <div className="text-center text-xs text-slate-400 pt-8 pb-8">
          <Shield className="w-4 h-4 mx-auto mb-2 opacity-50"/>
          صُنع بكل فخر بواسطة مشروع التكوين 🚀<br/>
          v2.1 (Sovereign Edition)
        </div>
      </div>
    </main>
  );
}
