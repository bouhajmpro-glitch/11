// app/layout.tsx
import './globals.css'
import React from 'react'
import Navbar from './Navbar'

export const metadata = {
  title: 'السماء الواعية',
  description: 'الجيل القادم من أنظمة الطقس والوعي البيئي',
  manifest: '/manifest.json', // الربط بملف الهوية
  themeColor: '#ffffff',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0', // منع التكبير باللمس ليشهبه التطبيق الأصلي
  icons: {
    icon: 'https://cdn-icons-png.flaticon.com/512/1163/1163624.png', // أيقونة المتصفح
    apple: 'https://cdn-icons-png.flaticon.com/512/1163/1163624.png', // أيقونة أيفون
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="pb-20 md:pb-0 md:pl-20 bg-slate-50 select-none"> {/* select-none لمنع تحديد النصوص مثل التطبيقات */}
        {children}
        <Navbar />
      </body>
    </html>
  )
}
