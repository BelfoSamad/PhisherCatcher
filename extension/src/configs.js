import {initializeApp} from 'firebase/app';
import {firebaseConfig} from './firebase_configs';

const app = initializeApp(firebaseConfig);
export {app}
export const defaults = {
  enableAutoBlock: true, // auto block website after check
  enableForceBlock: true, // allow only when legit
}