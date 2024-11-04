import {app} from '../../firebase_config';
import {getFirestore} from 'firebase/firestore';

const db = getFirestore(app);

// Listen for messages from the background service worker
chrome.runtime.onMessage.addListener(handleChromeMessages);
async function handleChromeMessages(message, _sender, sendResponse) {
    if (message.target !== 'offscreen_data') {
        return false;
    }

    switch (message.action) {
        //--------------------------
    }
}