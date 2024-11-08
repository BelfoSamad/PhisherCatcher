import {defaults} from "./configs";
import {startAnimations, checkUrl, sendAnalysis, stopAnimations, blockTab} from "./utilities";

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
        break;
      case "check":
        // get active tab
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          const activeTab = tabs[0];
          // extract domain
          const domain = new URL(activeTab.url).hostname.split(":")[0].toLowerCase();
          // verify if check is needed, then do check
          if (preCheck(activeTab.url, domain)) doCheck(domain);
        });
      case "block":
        blockTab(activeTabId);
        break;
    }
  }
});

//------------------------------- Tab Handling
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId == activeTabId & changeInfo.status == "complete") {
    // extract domain
    const domain = new URL(tab.url).hostname.split(":")[0].toLowerCase();
    // verify if check is needed, then do check
    if (preCheck(tab.url, domain)) doCheck(domain);
  }
});
chrome.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  tabs.delete(tabId);
});
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;// update activeTabId
  // send analysis to sidepanel
  sendAnalysis(tabs[activeTabId], false);
});

//------------------------------- Check URL
function preCheck(url, domain) {
  // check if new tab or chrome related tab
  if (url.startsWith("chrome://") || domain === "newtab") {
    tabs[activeTabId] = null; // set locally
    sendAnalysis(null, false); // send to sidepanel
    return false;
  }

  // page reload or navigate through same website, do nothing
  if (tabs[activeTabId] != null && tabs[activeTabId].id == domain) return false;

  // check if domain already exists (checked in another tab)
  for (const value of tabs.values()) {
    if ((value != null) && value.id === domain) {
      tabs[activeTabId] = value;
      sendAnalysis(value, false);
      return false;
    }
  }

  return true;
}

async function doCheck(domain) {
  // check only if user is logged-in
  if (userLoggedIn) {
    // get settings
    const settings = await chrome.storage.local.get(["enableAutoScan", "enableAutoBlock", "enableForceBlock"]);
    // start check (and animations)
    startAnimations(activeTabId);
    const analysis = await checkUrl(domain, settings['enableAutoScan'] ?? defaults.enableAutoScan);
    // set analysis
    tabs[activeTabId] = analysis; // set locally
    sendAnalysis(analysis, analysis == undefined); // send to sidepanel
    // stop animations
    stopAnimations(activeTabId);

    // block website
    if (settings['enableAutoBlock'] ?? defaults.enableAutoBlock) // Auto block allowed
      if (analysis.decision == "Malicious" || (analysis.decision == "Suspicious" && (settings['enableForceBlock'] ?? defaults.enableForceBlock)))
        blockTab(activeTabId); //URL is either Malicious (direct block) or Suspicious while Force Block is enabled
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