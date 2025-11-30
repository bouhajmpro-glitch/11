// public/sw.js
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
  });
  
  // استقبال الإشعارات من الخادم (أو محلياً)
  self.addEventListener('push', (event) => {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192.png', // تأكد من وجود أيقونة بهذا الاسم أو استخدم الرابط الخارجي
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  