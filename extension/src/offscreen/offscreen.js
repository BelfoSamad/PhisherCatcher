import {app} from '../configs';
import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';
import {getFirestore, getDoc, doc} from 'firebase/firestore';
import {getFunctions, httpsCallable} from 'firebase/functions';

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// listen to auth state
auth.onAuthStateChanged((user) => {
    chrome.runtime.sendMessage({target: "background", action: "userIn", isLoggedIn: user != null});
});

// Listen for messages from the background service worker
chrome.runtime.onMessage.addListener(handleChromeMessages);
function handleChromeMessages(message, _sender, sendResponse) {
    if (message.target == "offscreen") switch (message.action) {
        //--------------------------- Authentication
        case "register":
            (async () => {
                await createUserWithEmailAndPassword(auth, message.email, message.password);
                sendResponse({done: true});
            })();
            break;
        case "login":
            (async () => {
                await signInWithEmailAndPassword(auth, message.email, message.password);
                sendResponse({done: true});
            })();
            break;
        case "isLoggedIn":
            sendResponse({isLoggedIn: auth.currentUser != null});
            break;
        case "logout":
            auth.signOut();
            break;
        //--------------------------- Check
        case "check":
            getDoc(doc(db, "websites", message.domain)).then(async querySnapshot => {
                if (!querySnapshot.exists()) {
                    const analyzeWebsite = httpsCallable(functions, 'analyzeWebsiteFlow');
                    analyzeWebsite({url: message.url}).then(res => {sendResponse(res.data)});
                } else sendResponse(querySnapshot.data());
            });
            break;
    }

    return true;
}