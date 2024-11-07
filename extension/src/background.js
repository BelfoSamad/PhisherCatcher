import {defaults} from "./configs";

//------------------------------- Declarations
let creating; // A global promise to avoid concurrency issues
let activeTabId = -1;
let userLoggedIn = false;
const tabs = new Map();

//------------------------------- Starting
setupOffscreenDocument("./offscreen/offscreen.html");
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch((error) => console.error(error));
chrome.runtime.onMessage.addListener((message) => {
  if (message.target == "background" && message.action == "userIn") userLoggedIn = message.isLoggedIn;
});

//------------------------------- Tab Handling
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId == activeTabId & changeInfo.status == "complete") {
    // extract domain
    const domain = new URL(tab.url).hostname.split(":")[0].toLowerCase();
    // check if check is required
    if (preCheck(tab.url, domain)) {
      checkUrl(tab.url).then(analysis => {
        setTimeout(() => { //TODO: to remove, just use for testing animation
          tabs[activeTabId] = analysis;
          // stop page animation & send analysis to sidepanel
          chrome.tabs.sendMessage(activeTabId, {action: "stop_animation"});
          chrome.runtime.sendMessage({target: "sidepanel", action: "analysis", analysis: tabs[activeTabId], allowCheck: analysis == undefined});
        }, 5000);
      });
    }
  }
});
chrome.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  tabs.delete(tabId);
});
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;// update activeTabId
  // send details to sidepanel
  chrome.runtime.sendMessage({target: "sidepanel", action: "analysis", analysis: tabs[activeTabId], allowCheck: false});
});

//------------------------------- Check URL
function preCheck(url, domain) {
  // check if new tab or chrome related tab
  if (url.startsWith("chrome://") || domain === "newtab") {
    tabs[activeTabId] = null;
    chrome.runtime.sendMessage({target: "sidepanel", action: "analysis", analysis: tabs[activeTabId]});
    return false;
  }

  // reload check, do nothing
  if (tabs[activeTabId] != null && tabs[activeTabId].id == domain) return false;

  // check if domain already exists
  for (const value of tabs.values()) {
    if ((value != null) && value.id === domain) {
      tabs[activeTabId] = value;
      chrome.runtime.sendMessage({target: "sidepanel", action: "analysis", analysis: tabs[activeTabId]});
      return false;
    }
  }

  return true;
}

function checkUrl(domain) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["enableAutoScan", "enableAutoBlock", "enableForceBlock"], async (res) => {
      if (res['enableAutoScan'] ?? defaults.enableAutoScan) {
        // start animation
        chrome.tabs.sendMessage(activeTabId, {action: "start_animation"});
        chrome.runtime.sendMessage({target: "sidepanel", action: "start_animation"});

        // do analysis?
        // TODO: check if domain is well known
        // check in db/agent
        //const analysis = await chrome.runtime.sendMessage({target: "offscreen", action: "check", domain: domain});
        const analysis = {
          id: domain,
          percentage: Math.floor(Math.random() * 100),
          verdict: "This is a verdict for the website, either do or not",
          reasons: ["This is reason 1", "This is reason 2", "This is reason 3"],
          decision: ["Malicious"][Math.floor(Math.random() * 2)]
        }

        // make action if allowed before returning analysis
        // TODO: Clean this
        if ((res['enableAutoBlock'] ?? defaults.enableAutoBlock)
          && (analysis.decision == "Malicious"
            || (analysis.decision == "Suspicious"
              && (res['enableForceBlock'] ?? defaults.enableForceBlock))))
          chrome.tabs.sendMessage(activeTabId, {action: "block_tab"});
        resolve(analysis);
      } else resolve(undefined);
    });
  });
}

//------------------------------- Handle Offscreen Documents
async function setupOffscreenDocument(path) {
  // Check if there is offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['DOM_SCRAPING'],
      justification: 'this document is used to communicate with firebase (Auth, Firestore, Functions)',
    });
    await creating;
    creating = null;
  }
}