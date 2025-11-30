import './globals.css' // <--- هذا السطر هو الأهم!
import React from 'react'

export const metadata = {
  title: 'السماء الواعية',
  description: 'تطبيق الطقس الذكي',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="bg-slate-900 text-white">
        {children}
      </body>
    </html>
  )
}
