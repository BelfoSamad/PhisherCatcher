import {Firestore} from "firebase-admin/firestore";

// ----------------------------------------- Firestore Utilities
export async function addWebsite(firestore: Firestore, domain: string, analysis: any) {
    firestore.collection("websites").doc(domain).create(analysis);
}
