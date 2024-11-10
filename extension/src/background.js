import {defaults} from "./configs";
import {startAnimations, checkUrl, sendAnalysis, stopAnimations, blockTab, sendError} from "./utilities";

//------------------------------- Declarations
let creating; // A global promise to avoid concurrency issues
let activeTabId = -1;
let userLoggedIn = false;
const tabs = new Map();

//------------------------------- Starting
setupOffscreenDocument("./offscreen/offscreen.html");
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch((error) => console.error(error));
chrome.runtime.onMessage.addListener((message) => {
  if (message.target == "background") {
    switch (message.action) {
      case "userIn":
        userLoggedIn = message.isLoggedIn;
        return true;
      case "check":
        // get active tab
        chrome.tabs.query({active: true, currentWindow: true}, (activeTabs) => {
          const activeTab = activeTabs[0];
          // extract domain
          const domain = new URL(activeTab.url).hostname.split(":")[0].toLowerCase();
          // verify if check is needed, then do check
          if (preCheck(activeTab.url, domain)) doCheck(domain, true);
        });
        break;
      case "block":
        blockTab(activeTabId);
        break;
    }
  }
});

//------------------------------- Tab Handling
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    // extract domain
    const domain = new URL(details.url).hostname.split(":")[0].toLowerCase();
    // verify if check is needed, then do check
    if (preCheck(details.url, domain)) doCheck(domain, false);
  }
});
chrome.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  tabs.delete(tabId);
});
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;// update activeTabId
  // send analysis to sidepanel
  sendAnalysis(tabs.get(activeTabId), false);
});

//------------------------------- Check URL
function preCheck(url, domain) {
  // check if new tab or chrome related tab
  if (url.startsWith("chrome://")) {
    tabs.set(activeTabId, null); // set locally
    sendAnalysis(null, false); // send to sidepanel
    return false;
  }

  // page reload or navigate through same website, do nothing
  if (tabs.get(activeTabId)?.id == domain) return false;

  // check if domain already exists (checked in another tab)
  for (const value of tabs.values()) {
    if (value?.id === domain) {
      tabs.set(activeTabId, value);
      sendAnalysis(value, false);
      return false;
    }
  }

  return true;
}

async function doCheck(domain, manualCheck) {
  // check only if user is logged-in
  if (userLoggedIn) {
    // get settings
    const settings = await chrome.storage.local.get(["enableAutoCheck", "enableAutoBlock", "enableForceBlock"]);
    // start check (and animations)
    startAnimations(activeTabId);
    const result = await checkUrl(domain, (settings['enableAutoCheck'] ?? defaults.enableAutoCheck) || manualCheck);
    if (result == undefined) sendAnalysis(undefined, true); // send to sidepanel (manual check)
    else if (result.error != null) sendError(result.error)
    else {
      // set analysis
      tabs.set(activeTabId, result.analysis); // set locally
      sendAnalysis(result.analysis, result.analysis == undefined); // send to sidepanel (analysis rarely undefined)

      // block website
      if (settings['enableAutoBlock'] ?? defaults.enableAutoBlock) // Auto block allowed
        if (result.analysis.decision == "Malicious" || (result.analysis.decision == "Suspicious" && (settings['enableForceBlock'] ?? defaults.enableForceBlock)))
          blockTab(activeTabId); //URL is either Malicious (direct block) or Suspicious while Force Block is enabled
    }

    // stop animations
    stopAnimations(activeTabId);
  }
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