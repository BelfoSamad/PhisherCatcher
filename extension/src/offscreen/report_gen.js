import axios from "axios";
import moment from "moment";
import {parse} from "csv-parse/sync";

export async function checkDomainWording(domain) {
    const suspicions = [];
    suspicions.push(`Domain format (normal or IP): ${checkAddressFormat(domain)}`);
    suspicions.push(`Domain has misleading "http/https": ${domain.includes("http") ? "Yes" : "No"}`);
    suspicions.push(`Long Domain: ${domain.length > 50 ? "Yes" : "No"}`);
    suspicions.push(`Multiple hyphens: ${domain.split("-").length > 2 ? "Yes" : "No"}`);
    suspicions.push(`Mixed numbers & letters: ${/\d/.test(domain) && /[a-z]/.test(domain) ? "Yes" : "No"}`);
    suspicions.push(`Excessive subdomains: ${domain.split(".").length - 2 > 2 ? "Yes" : "No"}`);
    suspicions.push(`Puny code used: ${domain.startsWith("xn--") || /[^\x00-\x7F]/.test(domain) ? "Yes" : "No"}`);

    return suspicions;
}

const checkAddressFormat = (domain) => {
    // Regular expression for IPv4 in decimal format (e.g., 192.168.1.1)
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // Regular expression for IPv4 in hexadecimal format (e.g., 0xC0.0xA8.0x01.0x01)
    const ipv4HexRegex = /^(?:0x[0-9A-Fa-f]{1,2}\.){3}0x[0-9A-Fa-f]{1,2}$/;
    // Regular expression for IPv6 (e.g., 2001:0db8:85a3:0000:0000:8a2e:0370:7334)
    const ipv6Regex = /^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$/;
    // Regular expression for compressed IPv6 (e.g., 2001:db8::1)
    const ipv6CRegex = /^(?:[A-Fa-f0-9]{1,4}:){0,6}(?:[A-Fa-f0-9]{1,4})?::(?:[A-Fa-f0-9]{1,4}:){0,6}[A-Fa-f0-9]{1,4}$/;

    return ipv4Regex.test(domain) ? "Decimal IPV4" :
        ipv4HexRegex.test(domain) ? "Hexadecimal IPV4" :
            ipv6Regex.test(domain) ? "Regular IPV6" :
                ipv6CRegex.test(domain) ? "Compressed IPV6" : "Normal";
};

export async function checkRecords(apiKey, domain) {
    const suspicions = [];

    // check WHOIS
    try {
        const whoisInfo = await checkWHOIS(apiKey, domain);
        if (whoisInfo.domainAge != null) suspicions.push(`Domain Name Age: ${whoisInfo.domainAge} Years`);
        else suspicions.push(`Domain Name Age: Not Found`);
    } catch (err) {
        //Do nothing
    }

    // check TLD
    try {
        const tldInfo = checkTLD(domain);
        if (tldInfo.tldSuspicionSeverity != null) {
            suspicions.push(`Suspecious TLD of Severity: ${tldInfo.tldSuspicionSeverity}`);
        }
    } catch (err) {
        //Do nothing
    }

    // check SSL
    try {
        const sslInfo = await checkSSL(domain);
        if (!sslInfo.isCertificateValid) suspicions.push("SSL Certificate: Invalid");
        if (sslInfo.isCertificateValid) {
            suspicions.push(`SSL Certificate Remaining Days: ${sslInfo.certificationValidDays}`);
            suspicions.push(`SSL Certificate Issuer is Trusted: ${sslInfo.isIssuerTrusted ? "Yes" : "No"}`);
        }
    } catch (err) {
        /*Do nothing*/
    }

    return suspicions;
}

const checkWHOIS = async (apiKey, domain) => {
    console.log(apiKey);
    const response = await axios.get("https://api.jsonwhoisapi.com/v1/whois", {
        headers: {
            Accept: "application/json",
            Authorization: apiKey,
        },
        params: {
            identifier: domain,
        },
    });
    const data = response.data;
    if (data.created == null) return {domainAge: null}
    else {
        const creationDate = moment(data.created);
        const expiryDate = moment(data.expires);
        const domainAgeYears = parseInt(expiryDate.diff(creationDate, "years", true).toFixed());
        return {domainAge: domainAgeYears};
    }
};

const checkTLD = async (domain) => {
    // Get TLD
    const parts = domain.toLowerCase().split(".");
    let tld = parts[parts.length - 1];
    // Handle special cases like co.uk
    const commonSecondLevel = ["co", "com", "net", "org", "gov", "edu"];
    if (parts.length > 2 && commonSecondLevel.includes(parts[parts.length - 2])) {
        tld = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }

    // Load and parse CSV file
    const response = await (await fetch(chrome.runtime.getURL('suspicious_tlds.csv'))).text();
    const tldData = parse(response, {
        columns: true,
        skip_empty_lines: true,
    });

    // Create a map for faster lookups
    const tldMap = new Map(
        tldData.map((row) => [
            row.metadata_tld.toLowerCase(),
            row.metadata_severity,
        ])
    );

    return {
        tldSuspicionSeverity: tldMap.get(tld) || null,
    };
};

const checkSSL = async (domain) => {
    // Declarations
    const trustedIssuers = ["DigiCert", "Let's Encrypt", "GlobalSign", "Sectigo Limited", "Entrust Datacard",
        "GoDaddy", "GeoTrust", "Thawte", "Symantec", "RapidSSL", "Network Solutions", "Amazon Trust Services",
        "Buypass", "IdenTrust", "SwissSign", "Google Trust Services"];



    return new Promise(async (resolve) => {
        const response = await axios.get(`https://ssl-checker.io/api/v1/check/${domain}`, {
            headers: {
                Accept: "application/json",
            }
        });
        const data = response.data;

        if (data == null || data.status != "ok") resolve({isCertificateValid: false})
        else resolve({
            isCertificateValid: data.result.cert_valid,
            certificationValidDays: data.result.days_left,
            isIssuerTrusted: trustedIssuers.some((issuer) =>
                data.result.issuer_o.includes(issuer)
            ),
        });
    });
};