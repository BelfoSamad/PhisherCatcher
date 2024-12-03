import {app, defaults} from '../configs';
import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth/web-extension';
import {getFirestore, getDoc, setDoc, doc} from 'firebase/firestore';
import {getFunctions, httpsCallable} from 'firebase/functions';
import {getRemoteConfig, fetchAndActivate, getValue} from "firebase/remote-config";
import {checkDomainWording, checkRecords} from './report_gen';
import {runPrompt} from './prompt_api';

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const configs = getRemoteConfig(app);

// fetch and activate configs (to get APIKey)
await fetchAndActivate(configs);

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
                            // get WHOIS APIKey
                            const apiKey = getValue(configs, "WHOIS_API_KEY").asString();
                            // generate report
                            const report = [
                                ...(await checkDomainWording(message.domain)), // analyse wording
                                ...(await checkRecords(apiKey, message.domain)), // analyse records
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

                                        // properly analyzed, save results
                                        await setDoc(doc(db, "websites", message.domain), analysis);

                                        // send results back
                                        analysis["id"] = message.domain;
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
Your response must be only a JSON object with the following structure:
- percentage: A number (0 to 100) representing the suspicion level (higher values indicate greater suspicion).
- decision: A string with one of three values: "Legit", "Suspicious", or "Malicious".
- reasons: An array of strings explaining why the website is not legit based on the report and other factors, empty if Domain is legit
`