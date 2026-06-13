import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if config is present to prevent crashes
const isConfigured = !!firebaseConfig.apiKey;

const app = !getApps().length && isConfigured ? initializeApp(firebaseConfig) : isConfigured ? getApp() : null;

export const requestNotificationPermission = async () => {
  if (!app) return null;
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log("Push messaging is not supported in this browser.");
      return null;
    }

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const registration = await navigator.serviceWorker.ready;
      
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, // Get this from Firebase Console -> Project Settings -> Cloud Messaging -> Web configuration
        serviceWorkerRegistration: registration
      });
      console.log("Firebase push token:", token);
      return token;
    }
  } catch (error) {
    console.error("Error getting notification permission", error);
  }
  return null;
};

export const onMessageListener = () => {
  if (!app) return new Promise((resolve) => resolve(null));
  
  return new Promise((resolve) => {
    isSupported().then((supported) => {
      if (supported) {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      }
    });
  });
};
