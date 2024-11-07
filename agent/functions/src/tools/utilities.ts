import axios from "axios";
import moment from "moment";
import fs from "fs";
import csv from "csv-parse/sync";
import path from "path";
import https from "https";
import {TLSSocket} from "tls";

export const checkAddressFormat = (domain: string) => {
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

export const checkWHOIS = async (apiKey: string, domain: string) => {
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
    const creationDate = moment(data.created);
    const expiryDate = moment(data.expires);
    const domainAgeYears = parseInt(expiryDate.diff(creationDate, "years", true).toFixed());

    return {
        domainAge: domainAgeYears,
    };
};

export const checkTLD = (domain: string) => {
    // Get TLD
    const parts = domain.toLowerCase().split(".");
    let tld = parts[parts.length - 1];
    // Handle special cases like co.uk
    const commonSecondLevel = ["co", "com", "net", "org", "gov", "edu"];
    if (parts.length > 2 && commonSecondLevel.includes(parts[parts.length - 2])) {
        tld = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }

    // Load and parse CSV file
    const csvContent = fs.readFileSync(path.resolve("suspicious_tlds.csv"), "utf-8");
    const tldData = csv.parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
    });

    // Create a map for faster lookups
    const tldMap = new Map(
        tldData.map((row: {metadata_tld: string; metadata_severity: any;}) => [
            row.metadata_tld.toLowerCase(),
            row.metadata_severity,
        ])
    );

    return {
        tldSuspicionSeverity: tldMap.get(tld) || null,
    };
};

export const checkSSL = async (domain: string) => {
    // Declarations
    const trustedIssuers = ["DigiCert", "Let's Encrypt", "GlobalSign", "Sectigo", "Entrust Datacard",
        "GoDaddy", "GeoTrust", "Thawte", "Symantec", "RapidSSL", "Network Solutions", "Amazon Trust Services",
        "Buypass", "IdenTrust", "SwissSign", "Google Trust Services"];
    const options = {
        host: domain,
        method: "GET",
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            const tls = res.socket as TLSSocket;

            if (tls.authorized) {
                const certificate = tls.getPeerCertificate();
                if (!certificate || Object.keys(certificate).length === 0) resolve({isCertificateValid: false});
                else {
                    const validFrom = moment(certificate.valid_from);
                    const validTo = moment(certificate.valid_to);
                    const validDays = parseInt(validTo.diff(validFrom, "days", true).toFixed());
                    resolve({
                        isCertificateValid: validDays > 0,
                        certificationValidDays: validDays,
                        isIssuerTrusted: trustedIssuers.some((issuer) =>
                            certificate.issuer.O.includes(issuer)
                        ),
                    });
                }
            } else {
                resolve({isCertificateValid: false});
            }
        });

        req.end();
    });
};
