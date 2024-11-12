let session;
function legitWebsiteAnalysis(domain) {
    return {
        id: domain,
        percentage: 0,
        verdict: "This is a well known website. Feel safe to use it",
        reasons: null,
        decision: "Legit"
    }
}


export function startAnimations(tabId) {
    chrome.tabs.sendMessage(tabId, {action: "start_animation"});
    chrome.runtime.sendMessage({target: "sidepanel", action: "start_animation"});
}

export async function checkUrl(domain, autoCheck, localAiAvailable) {
    let localAiCheckResult;

    // auto check enabled
    if (autoCheck) {

        if (localAiAvailable) {
            // Local Ai available, run prompt
            localAiCheckResult = await runPrompt(`Is this domain "${domain}" a well known and legit domain or not, respond by either Yes or No`);
            switch (localAiCheckResult) {
                case "Yes":
                    // domain is recognized, return analysis
                    return {
                        error: null,
                        analysis: legitWebsiteAnalysis(domain)
                    };
                case "No":
                    // Do nothing, continue with further checking
                    break;
                default:
                    // either null (issue handling prompt) or LLM failed to handle prompt properly
                    localAiCheckResult = null; // make sure it is null in case it is LLM failure
            }
        }

        if (!localAiAvailable || (localAiAvailable && localAiCheckResult == null)) {
            // check if domain is well known
            const response = await fetch(chrome.runtime.getURL('websites.json'));
            const data = await response.json();
            // website well known, return Legit
            if (data.websites.includes(domain)) return {
                error: null,
                analysis: legitWebsiteAnalysis(domain)
            }
        }

        // check in db/agent
        return chrome.runtime.sendMessage({target: "offscreen", action: "check", domain: domain});
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

// --------------------------------------- Check Locally
async function runPrompt(prompt) {
    try {
        if (!session) session = await chrome.aiOriginTrial.languageModel.create();
        const result = await session.prompt(prompt);
        console.log(result);
        return result;
    } catch (e) {
        console.log("Error occured running prompt: " + e);
        reset();
        return null;
    }
}

async function reset() {
    if (session) session.destroy();
    session = null;
}