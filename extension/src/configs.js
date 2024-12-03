import { initializeApp } from 'firebase/app';

const app = initializeApp(firebaseConfig);
export {app}
export const defaults = {
  enableAutoCheck: true, // check automatically
  enableAutoBlock: true, // auto block website after check
  enableForceBlock: true, // allow only when legit
}