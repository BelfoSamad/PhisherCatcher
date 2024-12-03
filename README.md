> [!TIP]
> Try the extension: https://chromewebstore.google.com/detail/PhisherCatcher/mfggnkoginjdhpfgaopbmgebjakcidbj

PhisherCatcher is a chrome extension that uses LLM powered by Gemini to analyze website details like domain, SSL, WHOIS records to detect phishint attempts.
The project is split into 3 components: The front end (the extension), Firebase which handles the backend (Database and Authentication) and the agent built with Genkit and deployed into Firebase Functions.

The main project currently faces a major problem: **Should the extension check every website even well known ones?**. This is issue is covered in a primitive solution checking if the checked domain name exists in a hard-coded list of well known domain names. The list is too small and narrow and it misses a lot of well-known websites.

The newly available approach (in Experimental phase) is an In-device Large Language Model through **Gemini Nano** within Chrome. At this stage Gemini Nano will be only used to check if a domain name is well known or not, and in a future more stable releases it can move into a fully localized website legitimacy check.

# How does it work!

PhisherCatcher currently works with a hybrid approach checking the website through different stages:

- 1/ Check with **Chrome Built-in AI** if the website is well known or not.
- 2/ In case of a negative response or an issue, it fallback into the original primitive check (checking website with a pre-defined hardcoded list).
- 3/ In case after both checks the extension still doesn't recognize the website as legit (well-known). It does the online check through (1 - checking the database for already saved records then 2 - does the check with the deployed Gemini agent)

# Issues

Currently this approach is on alpha and requires a lot of work to be added. Here's some of the issues faced...

- Currently **Chrome Built-in Ai** is only on Chrome Dev/Canary channels and not yet stable.
- The model doesn't generate structured outputs so the check is based on the model answering by either _Yes_ or _No_
  - Currently the model throws an error when the answer is _No_ for some reason (``)
  - That's why the extension assumes that every output that doesn't equal "_Yes_" or a crash as the website not being recognized as a well known website and continues with the primitive check.
- Other model related crashes like: model not being properly loaded, unknwonErrors...etc.

# The Plan

- Make the current approach stable (after the release of the stable version of **Chrome Built-in Ai**)
- Improve on the approach on multiple stages
  - Properly detect all possible cases: well known legit/scam, potentially legit/scam
  - Do parts of the check within the extension then passing the pre-analysis report to the 
  - Do the whole check within the extension (locally)

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
