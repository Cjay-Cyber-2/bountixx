importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || "",
  authDomain: "bountixx.firebaseapp.com",
  projectId: "bountixx",
  storageBucket: "bountixx.firebasestorage.app",
  messagingSenderId: "915897028725",
  appId: "1:915897028725:web:96645cfd3bd49b78c7e83c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Bountixx';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    data: payload.data,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
