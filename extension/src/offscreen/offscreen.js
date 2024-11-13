import {app, defaults} from '../configs';
import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth/web-extension';
import {getFirestore, getDoc, setDoc, doc} from 'firebase/firestore';
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
                try {
                    let userCreds = await createUserWithEmailAndPassword(auth, message.email, message.password);
                    await setDoc(doc(db, "users", userCreds.user.uid), defaults);
                    sendResponse({done: true});
                } catch (e) {
                    sendResponse({done: false, error: e.message});
                }
            })();
            return true;
        case "login":
            (async () => {
                try {
                    let userCreds = await signInWithEmailAndPassword(auth, message.email, message.password);
                    getDoc(doc(db, "users", userCreds.user.uid)).then(async querySnapshot => {
                        sendResponse({done: true, settings: querySnapshot.exists() ? querySnapshot.data() : defaults});
                    });
                } catch (e) {
                    sendResponse({done: false, error: e.message});
                }
            })();
            return true;
        case "isLoggedIn":
            sendResponse({isLoggedIn: auth.currentUser != null});
            break;
        case "syncSettings":
            (async () => {
                try {
                    await setDoc(doc(db, "users", auth.currentUser.uid), message.settings);
                } catch (e) {/* Ignore */}
            })();
            break;
        case "logout":
            auth.signOut();
            break;
        //--------------------------- Check
        case "check":
            try {
                getDoc(doc(db, "websites", message.domain)).then(async querySnapshot => {
                    if (!querySnapshot.exists()) {
                        const analyzeWebsite = httpsCallable(functions, 'analyzeWebsiteFlow');
                        analyzeWebsite({domain: message.domain}).then(res => {
                            const analysis = res.data;
                            analysis["id"] = message.domain;
                            sendResponse({error: null, analysis: analysis});
                        });
                    } else {
                        const analysis = querySnapshot.data();
                        analysis["id"] = message.domain;
                        sendResponse({error: null, analysis: analysis});
                    }
                });
            } catch (e) {
                sendResponse({error: e.message, analysis: null});
            }
            return true;
    }

}