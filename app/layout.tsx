import './globals.css'
import React from 'react'
import Navbar from './Navbar' // تأكد من وجود Navbar.tsx

export const metadata = {
  title: 'السماء الواعية',
  description: 'نظام الطقس الذكي',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-900 text-white pb-20 md:pb-0 md:pr-20">
        {children}
        <Navbar /> {/* هنا السر: إعادة الشريط */}
      </body>
    </html>
  )
}
