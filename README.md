> [!TIP]
> Try the extension: https://chromewebstore.google.com/detail/PhisherCatcher/mfggnkoginjdhpfgaopbmgebjakcidbj

PhisherCatcher is a chrome extension that uses LLM powered by Gemini to analyze website details like domain, SSL, WHOIS records to detect phishint attempts.
The project is split into 3 components: The front end (the extension), Firebase which handles the backend (Database and Authentication) and the agent built with Genkit and deployed into Firebase Functions.

# Architecture

## The Extension

Represents the front end of the project, catches the active tab's newly updated URL and sends it to the agent for the analysis. Once results are returned, it shows the analysis and makes the appropriate actions. It is split into:

- `background.js`: The core of the extension which handles the observation of the status of Tabs and the currently active Tab. It saves the relevent analysis in memory to save resources and provide a fast experience to the user. It first checks the website locally if it is a well known domain name, then calls the agent for the check if it isn't.
- `offscreen.js`: Handles communications with Firebase (Authentication, Firestore and Functions). It provides DOM which is necessary to make some calls to Firebase without intercepting the user's experience.
- `content-script.js`: Shows the loading analysis on the webpage and Blocks/Unblocks the website based on its legitimacy
- `sidepanel.html`: the front end of the extension, built with Angular and handles the user's input (for Authentication - Login/Register), shows the analysis results and gets the preferences of the user (through the settings page)

## The Agent

Represents the core of the project. Built with Genkit. The agent receives the Domain name from the extension, starts preparing a Pre-analysis report checking the format of the domain (e.g. hyphens used, number of subdomains, words used...etc.) to catch any potential technique used by the scammer to make a familiar domain name, then checks the SSL certificate and WHOIS records to check if the domain's owner is legit or not...etc. This report is then fed to the prompt which generates the final analysis and returned back to the extension.

The agent is deployed to Firebase Functions and can be easily called from the extension.

## Firebase

A Serverless backend which handles all of the Authentication (Register and Login), Function calling to communicate with the agent and Firestore (Database) which saves reports of each checked domain name. This database is used for future checks so the extension would first check if the domain name already exists, if not it calls the agent for the analysis and saves the results.

This would make the extension auto-populate the database which first, saves token costs and second, builds a database that can be used for other projects later.

# How to run it

- For the agent:
  - Create a new Firebase Project, go to `Project Settings > Service accounts` and click on **Generate new private key**
  - Rename the generated key to `firebase-creds.json` and Copy/Paste it to `agent > functions`
  - Make sure to update the project-id in **index.ts** on `agent/functions/src/index.ts`
  - Create a `.env` file in `agent/functions/` and add
    - `GEMINI_API_KEY=<your gemini api key, you can generate in https:://aistudio.google.com>`
    - `WHOIS_API_KEY=<WHOIS api key, you can generate in https://jsonwhoisapi.com/>`
  - Make sure the two API Keys are added to Firebase Functions deployment. Use `firebase functions:secrets:set GEMINI_API_KEY` and `firebase functions:secrets:set WHOIS_API_KEY` on the terminal (assuming you have Firebase CLI installed and properly setup). A message will request you to add the api key, just copy/paste it.
  - If you want to test the agent before deploying, set the variable `debug` on `index.html` to true and run the **Developer Tools** using the command `genkit start`.
  - To deploy the agent to Firebase, use the command `firebase deploy`. (Make sure to set the variable `debug` back to false).
  - Check the official documentations for Genkit: https://firebase.google.com/docs/genkit
- For the extension:
  - After you have created a Firebase Project (while setting up the agent), Create a Web App copy the `firebaseConfig` constant and put it in a new file called `firebase_configs.js`.
  - You can find the Angular code related to the sidepanel on `extension/src/sidepanel/angular/`
  - You can build the extension using a predefined **Bash Script**, go to the root on terminal and run `sh bash.sh`
  - You can find the built extension on: `extension/dist/`
