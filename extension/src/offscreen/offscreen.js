import {app, defaults} from '../configs';
import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth/web-extension';
import {getFirestore, getDoc, setDoc, doc} from 'firebase/firestore';
import {checkDomainWording, checkRecords} from './report_gen';
import {runPrompt} from './prompt_api';

const auth = getAuth(app);
const db = getFirestore(app);

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
            (async () => {
                try {
                    getDoc(doc(db, "websites", message.domain)).then(async querySnapshot => {
                        if (!querySnapshot.exists()) {
                            // generate report
                            const report = [
                                ...(await checkDomainWording(message.domain)), // analyse wording
                                ...(await checkRecords(message.domain)), // analyse records
                            ];

                            // review with in-device Prompt API
                            const prompt = analyseWebsitePrompt(message.domain, report.join("\n"));
                            const response = await runPrompt(prompt);
                            let checkRemotely = response == null;

                            if (response != null) {
                                const regex = /```json([\s\S]*?)```/;
                                const match = response.match(regex);
                                if (match) {
                                    const jsonString = match[1].trim(); // Remove extra spaces or newlines
                                    try {
                                        // Parse the JSON string into a JavaScript object
                                        const analysis = JSON.parse(jsonString);
                                        sendResponse({error: null, analysis: analysis});
                                    } catch (error) {
                                        // En error happened converting text to JSON
                                        checkRemotely = true;
                                    }
                                } else {
                                    // No JSON found between the markers.
                                    checkRemotely = true;
                                }
                            }

                            if (checkRemotely) {
                                // Something happened in-device, check remotely [Fallback]
                                const analyzeWebsite = httpsCallable(functions, 'analyzeWebsiteFlow');
                                analyzeWebsite({domain: message.domain, report: report}).then(res => {
                                    const analysis = res.data;
                                    analysis["id"] = message.domain;
                                    sendResponse({error: null, analysis: analysis});
                                });
                            } else {
                                //TODO: Checked locally, save results
                            }
                        } else {
                            const analysis = querySnapshot.data();
                            analysis["id"] = message.domain;
                            sendResponse({error: null, analysis: analysis});
                        }
                    });
                } catch (e) {
                    sendResponse({error: e.message, analysis: null});
                }
            })();
            return true;
    }

}

const analyseWebsitePrompt = (domain, report) => `
Based on the following report about this domain name '${domain}' and your analysis, tell me if it is a legit or a phishing attempt website.
The Report ----
${report}
---
Return the response as a JSON which is structured as follow: {percentage: number, reasons: string[] | null, decision: string} where percentage is the percentage of suspicion of the domain, a simple list of reasons why would the website be suspicious (if website is legit then return null) and the decision which is either: Legit, Suspicious or Malicious.
`