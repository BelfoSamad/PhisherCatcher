import * as z from "zod";
import {configureGenkit} from "@genkit-ai/core";
import {firebase} from "@genkit-ai/firebase";
import {googleAI} from "@genkit-ai/googleai";
import {defineSecret} from "firebase-functions/params";
import {applicationDefault, initializeApp} from "firebase-admin/app";
import {firebaseAuth} from "@genkit-ai/firebase/auth";
import {onFlow} from "@genkit-ai/firebase/functions";
import {credential} from "firebase-admin";
import {config} from "dotenv";
import {getFirestore} from "firebase-admin/firestore";
import {dotprompt} from "@genkit-ai/dotprompt";
import {defineFlow} from "@genkit-ai/flow";

// Keys
const googleAIapiKey = defineSecret("GOOGLE_GENAI_API_KEY");
const whoisApiKey = defineSecret("WHOIS_API_KEY");
 
// ----------------------------------------- Initializations
const debug = true;
const app = initializeApp({credential: debug ? credential.cert("./phishercatcher-creds.json") : applicationDefault()});
const firestore = getFirestore(app);
if (debug) {
  firestore.settings({
    host: "localhost",
    port: 8080,
    ssl: false,
  });
}

// ----------------------------------------- Configurations
if (debug) config();
configureGenkit({
  plugins: [
    debug ? firebase({projectId: "phishercatcher-53f64"}) : firebase(),
    dotprompt(),
    debug ? googleAI({apiKey: process.env.GEMINI_API_KEY}) : googleAI(),
  ],
  logLevel: debug ? "debug" : "info",
  enableTracingAndMetrics: true,
});

// ----------------------------------------- Flows
export const analyzeWebsiteFlow = debug ? defineFlow(
  {
    name: "analyzeWebsiteFlow",
    inputSchema: z.object({
      userId: z.string(),
      url: z.string(),
    }),
    outputSchema: z.object({
      decision: z.number(),
      reasons: z.array(z.string()),
    }),
  },
  doAnalyzeWebsiteFlow,
) : onFlow(
  {
    name: "analyzeWebsiteFlow",
    httpsOptions: {
      secrets: [googleAIapiKey],
      cors: true,
    },
    inputSchema: z.object({
      userId: z.string(),
      url: z.string(),
    }),
    outputSchema: z.object({
      decision: z.number(),
      reasons: z.array(z.string()),
    }),
    authPolicy: firebaseAuth((user) => {
      if (!user) throw Error("ERROR::AUTH");
    }),
  },
  doAnalyzeWebsiteFlow,
);


async function doAnalyzeWebsiteFlow(input: any): Promise<any> {
}