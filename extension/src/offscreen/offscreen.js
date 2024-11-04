import {app} from '../firebase_config';
import {getAuth, createUserWithEmailAndPassword} from 'firebase/auth';
import {getFirestore, getDoc, doc} from 'firebase/firestore';
import {getFunctions} from 'firebase/functions';

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Listen for messages from the background service worker
chrome.runtime.onMessage.addListener(handleChromeMessages);
async function handleChromeMessages(message, _sender, sendResponse) {
    switch (message.action) {
        //--------------------------- Authentication
        case "register":
            await createUserWithEmailAndPassword(auth, message.email, message.password);
            sendResponse({done: true});
            break;
        case "login":
            await signInWithEmailAndPassword(auth, message.email, message.password);
            sendResponse({done: true});
            break;
        case "isLoggedIn":
            sendResponse({isLoggedIn: auth.currentUser != null});
            break;
        case "logout":
            auth.signOut();
            sendResponse({done: true});
            break;
        //--------------------------- Check
        case "check":
            getDoc(doc(db, "websites", message.domain)).then(async querySnapshot => {
                if (!querySnapshot.exists()) {
                    const analyzeWebsite = httpsCallable(functions, 'analyzeWebsiteFlow');
                    analyzeWebsite({url: url}).then(res => {sendResponse(res.data)});
                } else sendResponse(querySnapshot.data());
            });
            break;
    }
}