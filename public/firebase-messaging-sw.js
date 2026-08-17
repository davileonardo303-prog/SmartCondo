// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker for Background Push Notifications

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Configurações do Firebase do SmartCondo
const firebaseConfig = {
  apiKey: "AIzaSyBH7ywtJwNkxwhOcBSzpRqVgTtqgEVErXI",
  authDomain: "smartcondo-9d876.firebaseapp.com",
  projectId: "smartcondo-9d876",
  storageBucket: "smartcondo-9d876.firebasestorage.app",
  messagingSenderId: "184999237214",
  appId: "1:184999237214:web:71ee295707f4995a3bc6cf"
};

firebase.initializeApp(firebaseConfig);

let messaging;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Messaging não suportado neste navegador:', e);
}

// Disparo de notificação em segundo plano (App fechado ou em background)
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Notificação em segundo plano recebida:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'SmartCondo';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Você possui uma nova notificação do condomínio.',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: payload.data?.tag || 'smartcondo-notification',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      data: payload.data || { url: '/' }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Clique na notificação na barra de tarefas (Abre ou foca no app)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
