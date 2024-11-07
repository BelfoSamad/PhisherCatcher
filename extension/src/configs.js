import { initializeApp } from 'firebase/app';

const firebaseConfig = {
    apiKey: "AIzaSyDoA3JmNA6PA4GrqwGX3dSfkH170C-gyQ8",
    authDomain: "phishercatcher-53f64.firebaseapp.com",
    projectId: "phishercatcher-53f64",
    storageBucket: "phishercatcher-53f64.firebasestorage.app",
    messagingSenderId: "175915771245",
    appId: "1:175915771245:web:5e297ba3e3af545c71e664",
    measurementId: "G-K0TDER4073"
  };

const app = initializeApp(firebaseConfig);
export {app}
export const defaults = {
  enableAutoScan: true,
  enableAutoBlock: true,
  enableForceBlock: true,
  enableUnblocking: true
}