**PhisherCatcher** is a chrome extension that uses LLM powered by Gemini to analyze website details like domain, SSL, WHOIS records to detect phishint attempts.

# Features

- [x] Creates a pre-analysis report with basic checks: Domain Format, SSL Certificate, WHOIS Records, TLD
- [x] Passes the pre-analysis report into an LLM Model to decide on the legitimacy of the website.
- [x] Returns a decision, percentage of suspicion and a list of potential reasons.
- [x] Automatically works on the background + Blocks potentially suspicious websites.
- [x] You have the ability to unblock/re-block website if you still want to use it.
- [x] Fully in-device using Prompt API
- [x] Falls-back into a remote agent in case Prompt API is unavailable or a problem occurred

# Architecture

## The Extension

Represents the front end of the project, catches the active tab's newly updated URL and generates a pre-analysis report which is used with an LLM model to analyze the website's legitimacy. The extension is structured as follow:

- `background.js`: The core of the extension which handles the observation of the status of Tabs and the currently active Tab. It saves the relevent analysis in memory to save resources and provide a fast experience to the user. It communicates with the `offscreen.js`, `content script` and the `sidepanel` to handle the analysis process.
- `offscreen.js`: Due to it having access to DOM without interrupting the user's experience. It communicates with **Firebase** (Authentication, Firestore, Functions and RemoteConfig) to provide the basic backend capabilities, and provides access to built-in AI capabilities (Prompt API).
- `content script`: Mainly to show the loading animation and blocs the website if it is deemed as a phishing attempt.
- `sidepanel`: the front end of the extension, built with Angular and handles the user's input (for Authentication - Login/Register), shows the analysis of the website when requested by the user and where the user can handle settings.

## The Agent

Built with Genkit. Initially was receiving the URL then generating the Pre-Analysis report and make analyze the website. But with the introduction of **Prompt API**, it currently just acts as a Fallback mechanism in case the **Prompt API** is unavailable or a problem occured. The agent should be replaced by a direct call into **Gemini** from within the exception unless there's a more complex check which needs a proper backend.

## Firebase

A Serverless backend which handles all of the Authentication (Register and Login), Function calling to communicate with the agent and Firestore (Database) which saves analysis of websites and finally RemoteConfig where we can retreive the API Keys without exposing them on the extension.
The database is used for future analysis so the extension would first check if the Domain name exists on the database then calls the _Prompt API_ or the _Agent_ to analyze the website and save the result. This would make the extension auto-populate the database which first, saves token costs and second, builds a database that can be used for other projects later.

# How to Run it

## Agent

First you need to have a **Firebase Project** and enable _Authentication_ and _Firestore_ and _Remote Configuration_.

```
    - go to Project Settings > Service accounts
    - Click on "Generate new private key"
    - Rename the genrated key to "firebase-creds.json"
    - Copy/Paste the key file into "agent/functions"
    - Make sure to update the "project-id" on "agent/functions/src/index.ts"
```

Then you need to provide the **Gemini's API Key**.

```
    - Create a ".env" file on "agent/functions"
    - Add the Gemini API Key: "GENAI_API_KEY=<your gemini api key, you can generate in https:://aistudio.google.com>"
    - Make sure the API Key is added to "Firebase Functions", use "firebase functions:secrets:set GEMINI_API_KEY" and paste the API Key and click enter (text will be hidden, just paste and click enter)
```

You can check the project before deploying, first set `debug = true` then run the command line `npm run genkit`. To deploy the project, first make sure that `debug = false` then run the command line (on "/agent") `firebase deploy`.
Check [Genkit official documentations](https://firebase.google.com/docs/genkit) for more information.

## Extension

Assuming you have already created and setup a **Firebase Project** for the Agent. Create a **Web Application** and copy the `firebaseConfig` constant and put it in a new file called `firebase_configs.js`.

```typescript
// put this in a new file called firebase_configs.js
// while setting up the Web App (on Firebase), you will find this constant ready, just copy paste it (and make sure the name is correct)
export const firebaseConfig = {
  apiKey: "<your api key>",
  authDomain: "<your authDomain>",
  projectId: "<your projectId>",
  storageBucket: "<your storageBucket>",
  messagingSenderId: "<your messagingSenderId>",
  appId: "<your app id>",
  measurementId: "<your measurementId>",
};
```

You will need a **WHOIS_API_KEY** which you can get from [https://jsonwhoisapi.com/](https://jsonwhoisapi.com/) then add it via Firebase's Remote Configuration panel under the name `WHOIS_API_KEY`.

---

You can build the extension using the **Bash Script** defined as `build.sh`. Just run the command line `sh build.sh` then you can find the built extension on `extension/dist`.

## Built-In Capabilities

> [!WARNING]
> Gemini Nano for Chrome is still in experimental and only running from **Chrome 131** to **Chrome 136**.
> preferrably use [Chrome Canary](https://www.google.com/chrome/canary/)

Check these documentations for: [Prompt API](https://docs.google.com/document/d/1VG8HIyz361zGduWgNG7R_R8Xkv0OOJ8b5C9QKeCjU0c/edit?tab=t.0) To properly setup your Chrome to be able to use the In-Device capabilities.

# Problems and Future Plans

- [ ] The built-in AI capabilities (like Prompt API) are still in Beta
  - The process is too slow.
  - The generation is also currently les reliabale than a full Gemini Model.
  - The tokens are limited which might cause a problem later when more details are added to the pre-analysis report.
  - The exception `The model attempted to output text in an untested language, and was prevented from doing so` is thrown frequently.
