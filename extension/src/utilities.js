export function startAnimations(tabId) {
    chrome.tabs.sendMessage(tabId, {action: "start_animation"});
    chrome.runtime.sendMessage({target: "sidepanel", action: "start_animation"});
}

export async function checkUrl(domain, autoCheck) {
    // auto check enabled
    if (autoCheck) {
        // check if domain is well known
        const response = await fetch(chrome.runtime.getURL('websites.json'));
        const data = await response.json();
        if (data.websites.includes(domain)) {
            // website well known, return Legit
            return {
                id: domain,
                percentage: 0,
                verdict: "This is a well known website. Feel save to use it",
                reasons: null,
                decision: "Legit"
            }
        } else {
            // check in db/agent
            return chrome.runtime.sendMessage({target: "offscreen", action: "check", domain: domain});
        }
    } else return undefined; // no auto check, has to check manually
}

export function stopAnimations(tabId) {
    chrome.tabs.sendMessage(tabId, {action: "stop_animation"});
}

export function sendAnalysis(analysis, allowCheck) {
    chrome.runtime.sendMessage({target: "sidepanel", action: "analysis", analysis: analysis, allowCheck: allowCheck});
}

export function sendError(error) {
    chrome.runtime.sendMessage({target: "sidepanel", action: "error", error: error});
}

export function blockTab(tabId) {
    chrome.tabs.sendMessage(tabId, {action: "block_tab"});
}