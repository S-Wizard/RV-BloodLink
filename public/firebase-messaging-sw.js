importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// You must paste your Firebase config here as well to work in the background!
// The user will replace this when they set up Firebase.
firebase.initializeApp({
  apiKey: "AIzaSyA_2T4gC3sRjXpEgw7n3XccdiFVM4xvLQI",
  authDomain: "rv-bloodlink-f3603.firebaseapp.com",
  projectId: "rv-bloodlink-f3603",
  storageBucket: "rv-bloodlink-f3603.firebasestorage.app",
  messagingSenderId: "279455384652",
  appId: "1:279455384652:web:136cabea1a6faf8527a0e9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png' // Make sure you have an icon in public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
