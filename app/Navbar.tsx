// app/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// الأيقونات (مع تحسين الألوان)
const Icons = {
  Home: (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  Map: (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
  ),
  Lab: (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"/><path d="M13 6l6 6"/><path d="M9 10L3 16v4h6l6-6"/><path d="M11.5 8.5l3 3"/></svg>
  ),
  Settings: (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Zap: (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  )
};

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { name: 'الرئيسية', href: '/', icon: Icons.Home },
    { name: 'الرادار', href: '/radar', icon: Icons.Map },
    { name: 'المختبر', href: '/lab', icon: Icons.Lab },
    { name: 'الإعدادات', href: '/settings', icon: Icons.Settings },
  ];

  return (
    <>
      {/* --- شريط الموبايل (Bottom Bar) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[1000] pb-2 pt-1 shadow-lg">
        <div className="flex justify-around items-center">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className="flex flex-col items-center justify-center w-full p-2"
              >
                {/* هنا الإجبار: إذا نشط = أزرق، غير نشط = رمادي غامق */}
                <Icon 
                  className={`w-6 h-6 mb-1 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} 
                />
                <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* --- شريط الحاسوب (Sidebar) --- */}
      <nav className="hidden md:flex fixed right-0 top-0 bottom-0 w-20 flex-col items-center py-8 bg-white border-l border-slate-200 z-[1000] shadow-xl">
        <div className="mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Icons.Zap className="text-white w-7 h-7" />
          </div>
        </div>
        
        <div className="flex flex-col gap-6 w-full px-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center justify-center p-3.5 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon className="w-6 h-6" />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
