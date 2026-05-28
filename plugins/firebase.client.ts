import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCsLFm2pEX0gRuJdNFCzjYfeP7Kw7dW2XY",
    authDomain: "ousanuxt.firebaseapp.com",
    projectId: "ousanuxt",
    storageBucket: "ousanuxt.firebasestorage.app",
    messagingSenderId: "252420930244",
    appId: "1:252420930244:web:d7c651640ad45df953e791",
    measurementId: "G-XRFKS9J3DX"
};

export default defineNuxtPlugin(() => {
    const app = initializeApp(firebaseConfig);
    const analytics = getAnalytics(app);

    return {
        provide: { firebase: app, analytics }
    };
});
