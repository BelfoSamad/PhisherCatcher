import {app} from '../../firebase_config';
import {getAuth} from 'firebase/auth';

const auth = getAuth(app);

// Listen for messages from the background service worker
chrome.runtime.onMessage.addListener(handleChromeMessages);
async function handleChromeMessages(message, _sender, sendResponse) {
    if (message.target !== 'offscreen_auth') {
        return false;
    }

    switch (message.action) {
        //--------------------------
    }
}