// app/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { User, Trash2, Shield, Bell, Moon } from 'lucide-react';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [notifications, setNotifications] = useState(false); // الافتراضي مغلق حتى نأخذ الإذن
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('userName') || '';
    setName(savedName);
    
    // التحقق مما إذا كان المستخدم قد وافق سابقاً
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setNotifications(true);
      }
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    localStorage.setItem('userName', e.target.value);
  };

  const toggleNotifications = () => {
    if (!('Notification' in window)) {
      alert('هذا المتصفح لا يدعم الإشعارات');
      return;
    }

    if (notifications) {
      // لا يمكن إلغاء الإذن برمجياً، فقط نغير حالة الزر شكلياً
      setNotifications(false);
    } else {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          setNotifications(true);
          // إرسال إشعار تجريبي
          new Notification("تم التفعيل بنجاح ✅", {
            body: "ستصلك أهم تنبيهات الطقس والكوارث هنا.",
            icon: "https://cdn-icons-png.flaticon.com/512/1163/1163624.png"
          });
        } else {
          alert('يجب السماح بالإشعارات من إعدادات المتصفح.');
        }
      });
    }
  };

  const clearData = () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('هل أنت متأكد؟ سيتم مسح موقعك المفضل واسمك.')) {
      localStorage.clear();
      alert('تم مسح البيانات بنجاح. سيعود التطبيق جديداً.');
      window.location.href = '/';
    }
  };

  return (
    <main className="min-h-screen p-4 pb-24 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8 mt-4">الإعدادات</h1>

      <div className="space-y-6">
        
        <section>
          <h2 className="text-sm font-bold text-slate-400 mb-3 px-1">الملف الشخصي</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">بماذا تريد أن أناديك؟</label>
                <input 
                  type="text" 
                  placeholder="أدخل اسمك هنا..." 
                  value={name}
                  onChange={handleNameChange}
                  className="w-full font-bold text-slate-800 outline-none placeholder:font-normal"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-400 mb-3 px-1">التفضيلات</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
            
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg text-orange-500"><Bell className="w-5 h-5" /></div>
                <span className="font-medium text-slate-700">تنبيهات الطقس القاسي</span>
              </div>
              <div 
                onClick={toggleNotifications}
                className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${notifications ? 'bg-green-500' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${notifications ? 'translate-x-[-20px]' : ''}`}></div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-500"><Moon className="w-5 h-5" /></div>
                <span className="font-medium text-slate-700">الوضع الليلي</span>
              </div>
              <div 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${darkMode ? 'translate-x-[-20px]' : ''}`}></div>
              </div>
            </div>

          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-400 mb-3 px-1">البيانات والخصوصية</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
            
            <button onClick={clearData} className="w-full p-4 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors text-right">
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">مسح جميع البيانات وإعادة الضبط</span>
            </button>

            <div className="p-4 flex items-center gap-3 text-slate-600">
              <Shield className="w-5 h-5" />
              <span className="font-medium text-sm">رقم النسخة: 1.1.0 (Live)</span>
            </div>

          </div>
        </section>

        <div className="text-center text-xs text-slate-400 pt-8">
          صُنع بكل فخر بواسطة مشروع التكوين 🚀<br/>
          جميع الحقوق محفوظة 2025
        </div>

      </div>
    </main>
  );
}
