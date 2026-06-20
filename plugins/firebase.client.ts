import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCsLFm2pEX0gRuJdNFCzjYfeP7Kw7dW2XY",
    authDomain: "ousanuxt.firebaseapp.com",
    projectId: "ousanuxt",
    storageBucket: "ousanuxt.firebasestorage.app",
    messagingSenderId: "252420930244",
    appId: "1:252420930244:web:d7c651640ad45df953e791",
    measurementId: "G-XRFKS9J3DX"
};

const goldFirebaseConfig = {
    apiKey: "AIzaSyAzLOdlzZOe8aiy-RVChTtJlXiEL2VnuUA",
    authDomain: "nuxt-gold.firebaseapp.com",
    projectId: "nuxt-gold",
    storageBucket: "nuxt-gold.firebasestorage.app",
    messagingSenderId: "310538740362",
    appId: "1:310538740362:web:cd9f1df9fd079a3a260373",
    measurementId: "G-LGBHF6VW2T"
};

export default defineNuxtPlugin(() => {
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);

    const goldApp = initializeApp(goldFirebaseConfig, "nuxt-gold");
    const goldAnalytics = getAnalytics(goldApp);
    const goldDb = getFirestore(goldApp);

    return {
        provide: {
            firebase: app,
            analytics,
            goldFirebase: goldApp,
            goldAnalytics,
            goldDb,
        }
    };
});
