import {promptRef} from "@genkit-ai/dotprompt";
import {checkAddressFormat, checkSSL, checkTLD, checkWHOIS} from "./tools/utilities";
import {SecretParam} from "firebase-functions/lib/params/types";

export async function checkDomainWording(domain: string): Promise<string[]> {
    const suspicions: string[] = [];
    suspicions.push(`Domain name format (normal or IP): ${checkAddressFormat(domain)}`);
    suspicions.push(`Domain name has misleading "http/https": ${domain.includes("http") ? "Yes" : "No"}`);
    suspicions.push(`Long Domain name: ${domain.length > 50 ? "Yes" : "No"}`);
    suspicions.push(`Multiple hyphens: ${domain.split("-").length > 2 ? "Yes" : "No"}`);
    suspicions.push(`Mixed numbers & letters: ${/\d/.test(domain) && /[a-z]/.test(domain) ? "Yes" : "No"}`);
    suspicions.push(`Excessive subdomains: ${domain.split(".").length - 2 > 2 ? "Yes" : "No"}`);
    suspicions.push(`Puny code used: ${domain.startsWith("xn--") || /[^\x00-\x7F]/.test(domain) ? "Yes" : "No"}`);

    const misleadingChecker = (await promptRef("misleading_checker").generate({input: {domain: domain}})).output();
    if (misleadingChecker.isMisleading) suspicions.push(`Misleading Domain name: ${misleadingChecker.original}`);

    const wordsChecker = (await promptRef("words_checker").generate({input: {domain: domain}})).output();
    if (wordsChecker.isSuspicious) suspicions.push(`Domain uses suspecious words: ${wordsChecker.original.split(", ")}`);

    return suspicions;
}

export async function checkRecords(debug: boolean, domain: string, whoisApiKey: SecretParam): Promise<string[]> {
    const suspicions: string[] = [];

    try {
        const whoisInfo = await checkWHOIS(debug ? process.env.WHOIS_API_KEY! : whoisApiKey.value(), domain);
        suspicions.push(`Domain Name Age: ${whoisInfo.domainAge}`);
    } catch (err) {
        console.log("An error caught, ignore!. Error: " + err);
    }

    try {
        const tldInfo = checkTLD(domain);
        if (tldInfo.tldSuspicionSeverity != null)
            suspicions.push(`Suspecious TLD of Severity: ${tldInfo.tldSuspicionSeverity}`);
    } catch (err) {
        console.log("An error caught, ignore!. Error: " + err);
    }

    try {
        const sslInfo: any = await checkSSL(domain);
        if (!sslInfo.isCertificateValid) suspicions.push("SSL Certificate: Invalid");
        if (sslInfo.isCertificateValid) {
            suspicions.push(`SSL Certificate Remaining Days: ${sslInfo.certificationValidDays}`);
            suspicions.push(`SSL Certificate Issuer is Trusted: ${sslInfo.isIssuerTrusted ? "Yes" : "No"}`);
        }
    } catch (err) {
        console.log("An error caught, ignore!. Error: " + err);
    }

    return suspicions;
}