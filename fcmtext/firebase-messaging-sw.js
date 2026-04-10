importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCRqpxQHSHD_woKMDbmj-zLGHFZO91QFNg",
  authDomain: "homelyx-89b14.firebasestorage.app",
  projectId: "homelyx-89b14",
  messagingSenderId: "188422054211",
  appId: "1:188422054211:android:8f44a93c2cbb2f59104ff6",
});

const messaging = firebase.messaging();

// Background notification
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
    }
  );
});
