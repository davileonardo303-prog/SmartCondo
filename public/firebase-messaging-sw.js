// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker for Background & Lock Screen Push Notifications

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

try {
  firebase.initializeApp(firebaseConfig);
} catch (e) {
  // Já inicializado ou fallback
}

let messaging;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Messaging não suportado neste navegador:', e);
}

// Disparo de notificação em segundo plano via Firebase Cloud Messaging
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Notificação FCM em segundo plano recebida:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || '📦 Encomenda Chegou!';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Você possui uma encomenda aguardando retirada na portaria.',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: payload.data?.tag || `encomenda-${Date.now()}`,
      vibrate: [300, 100, 300, 100, 300],
      requireInteraction: true,
      data: payload.data || { url: '/', tab: 'encomendas' },
      actions: [
        { action: 'open_encomenda', title: 'Ver Código PIN' },
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Escuta mensagens enviadas diretamente da aplicação (para alertas em segundo plano e tela bloqueada)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      vibrate: [300, 100, 300, 100, 300],
      requireInteraction: true,
      ...options,
    });
  }
});

// Clique na notificação na barra de tarefas ou tela de bloqueio
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (client.postMessage) {
            client.postMessage({
              type: 'OPEN_ENCOMENDA_TAB',
              data: event.notification.data,
            });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
