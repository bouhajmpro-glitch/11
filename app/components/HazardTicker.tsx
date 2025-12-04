'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AlertTriangle, Info, Rocket, Microscope, Globe, Wifi, Satellite, 
  Zap, Volume2, VolumeX, X, ExternalLink, Newspaper 
} from 'lucide-react';
import { NewsItem } from '../core/weather/types';

// رابط ملف الأخبار الخارجي
const GITHUB_NEWS_URL = 'https://raw.githubusercontent.com/bouhajmpro/weather-crawler/main/news.json';

// النصائح الثابتة
const STATIC_TIPS: NewsItem[] = [
  { type: 'info', text: 'نصيحة: حافظ على رطوبة جسمك، الرطوبة العالية تزيد الشعور بالحرارة.', source: 'الصحة', details: 'شرب الماء بانتظام يساعد الجسم على تنظيم حرارته خاصة في الأيام الرطبة.' },
  { type: 'science', text: 'معلومة: الضغط الجوي المستقر يساعد على تحسين جودة النوم.', source: 'علوم', details: 'تشير الدراسات إلى أن تقلبات الضغط الجوي تؤثر على الساعة البيولوجية للإنسان.' }
];

export const HazardTicker = ({ news }: { news: NewsItem[] }) => {
  const [crawlerNews, setCrawlerNews] = useState<NewsItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  
  // حالات القراءة الصوتية والتفاصيل
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null); // للنافذة المنبثقة
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // جلب الأخبار الخارجية
  useEffect(() => {
    const fetchGithubNews = async () => {
      try {
        const res = await fetch(GITHUB_NEWS_URL);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCrawlerNews(data);
            setIsLive(true);
          }
        }
      } catch (e) {
        console.warn("Crawler Offline");
      }
    };
    fetchGithubNews();
    const interval = setInterval(fetchGithubNews, 300000);
    return () => clearInterval(interval);
  }, []);

  // دمج الأخبار
  const displayItems = useMemo(() => {
    const combined = [...(news || []), ...crawlerNews, ...STATIC_TIPS];
    // إزالة التكرار
    const unique = combined.filter((item, index, self) =>
      index === self.findIndex((t) => t.text === item.text)
    );
    return unique;
  }, [news, crawlerNews]);

  // منطق القارئ الصوتي
  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // تجميع النصوص لقراءتها
      const fullText = displayItems.map(item => `خبر من ${item.source || 'النظام'}: ${item.text}`).join('. ... ');
      
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.lang = 'ar-SA'; // اللغة العربية
      utterance.rate = 0.9; // سرعة القراءة
      utterance.onend = () => setIsSpeaking(false);
      
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // إيقاف الصوت عند مغادرة الصفحة
  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'danger': return <AlertTriangle size={14} className="text-red-500" />;
      case 'space': return <Rocket size={14} className="text-purple-400" />;
      case 'science': return <Microscope size={14} className="text-teal-400" />;
      case 'crawler': return <Globe size={14} className="text-indigo-400" />;
      case 'info': return <Info size={14} className="text-blue-400" />;
      default: return <Satellite size={14} className="text-slate-400" />;
    }
  };

  const getStyle = (type: string) => {
    switch (type) {
      case 'danger': return 'text-red-400 border-red-500/30 bg-red-500/10 animate-pulse';
      case 'space': return 'text-purple-300 border-purple-500/30 bg-purple-500/10';
      case 'science': return 'text-teal-300 border-teal-500/30 bg-teal-500/10';
      case 'crawler': return 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10';
      default: return 'text-slate-300 border-slate-500/30 bg-slate-500/10';
    }
  };

  return (
    <>
      <div className="w-full bg-slate-900/90 border-y border-white/10 backdrop-blur-xl h-10 overflow-hidden relative mb-4 flex items-center shadow-lg z-30 group/ticker">
        
        {/* التدرجات الجانبية */}
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0f172a] to-transparent z-20 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0f172a] to-transparent z-20 pointer-events-none"></div>

        {/* أدوات التحكم (يسار): القارئ الصوتي */}
        <div className="absolute left-0 top-0 bottom-0 bg-[#0f172a] z-30 px-3 flex items-center border-r border-white/10 gap-2">
           <button 
             onClick={toggleSpeech}
             className={`p-1.5 rounded-full transition-all ${isSpeaking ? 'bg-blue-500 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
             title="قراءة الأخبار"
           >
             {isSpeaking ? <Volume2 size={14} /> : <VolumeX size={14} />}
           </button>
        </div>

        {/* مؤشر البث الحي (يمين) */}
        <div className="absolute right-0 top-0 bottom-0 bg-[#0f172a] z-30 px-3 flex items-center border-l border-white/10">
          <div className="flex items-center gap-1.5">
              <Wifi size={12} className={`${isLive || news.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`} />
              <span className={`text-[10px] font-bold ${isLive || news.length > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                {isLive ? 'LIVE' : 'OFF'}
              </span>
          </div>
        </div>
        
        {/* الشريط المتحرك (يتوقف عند مرور الماوس hover) */}
        <div className="animate-marquee whitespace-nowrap flex items-center h-full gap-8 pr-20 pl-14 group-hover/ticker:[animation-play-state:paused]">
          {/* نضاعف القائمة للحركة المستمرة */}
          {[...displayItems, ...displayItems].map((item, i) => (
            <button 
              key={i} 
              onClick={() => setSelectedNews(item)}
              className="flex items-center gap-3 px-2 group/item cursor-pointer hover:bg-white/5 rounded-lg py-1 transition-colors"
            >
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all ${getStyle(item.type)}`}>
                {getIcon(item.type)}
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  {item.source || 'SYSTEM'}
                </span>
              </div>
              <span className={`text-xs font-medium tracking-wide ${item.type === 'danger' ? 'text-red-100 font-bold' : 'text-slate-300 group-hover/item:text-white'}`}>
                {item.text}
              </span>
              <Zap size={10} className="text-slate-700 mx-2 opacity-50" />
            </button>
          ))}
        </div>
      </div>

      {/* نافذة التفاصيل (Modal) */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedNews(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-2 mb-4">
               <div className={`p-2 rounded-full border ${getStyle(selectedNews.type).split(' ')[1]} bg-opacity-20`}>
                 {getIcon(selectedNews.type)}
               </div>
               <span className="text-sm font-bold text-slate-300 uppercase">{selectedNews.source || 'مصدر النظام'}</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-4 leading-relaxed">
              {selectedNews.text}
            </h3>

            {selectedNews.details && (
              <div className="bg-white/5 p-4 rounded-xl text-slate-300 text-sm leading-6 mb-4">
                {selectedNews.details}
              </div>
            )}

            {selectedNews.link && (
              <a 
                href={selectedNews.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
              >
                <ExternalLink size={18} />
                قراءة المزيد من المصدر
              </a>
            )}
            
            {!selectedNews.link && !selectedNews.details && (
              <p className="text-center text-slate-500 text-xs mt-4">لا توجد تفاصيل إضافية لهذا الخبر.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};