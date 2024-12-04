import {defaults} from "./configs";
import {startAnimations, checkUrl, sendTabDetails, sendTabError, stopAnimations, blockTab} from "./utilities";

//------------------------------- Declarations
let creating; // A global promise to avoid concurrency issues
let activeTabId = -1;
const tabs = new Map();

//------------------------------- Initiation
setupOffscreenDocument("./offscreen/offscreen.html");
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch((error) => console.error(error));
chrome.runtime.onMessage.addListener((message) => {
  if (message.target == "background") {
    switch (message.action) {
      case "init":
        sendTabDetails(tabs.get(activeTabId));
        break;
      case "block":
        blockTab(activeTabId);
        break;
    }
  }
});

//------------------------------- Tab Handling
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) {
    // extract domain
    const domain = new URL(details.url).hostname.split(":")[0].toLowerCase();
    // verify if check is needed, then do check
    if (preCheck(details.url, domain)) doCheck(domain);
    else {
      // re-apply block if website is not legit
      const settings = await chrome.storage.local.get(["enableAutoBlock", "enableForceBlock"]);
      const analysis = tabs.get(activeTabId)
      // block website
      if (settings['enableAutoBlock'] ?? defaults.enableAutoBlock) // Auto block allowed
        if (analysis?.decision == "Malicious" || (analysis?.decision == "Suspicious" && (settings['enableForceBlock'] ?? defaults.enableForceBlock)))
          blockTab(activeTabId); //URL is either Malicious (direct block) or Suspicious while Force Block is enabled
    }
  }
});
chrome.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  tabs.delete(tabId);
});
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;// update activeTabId
  // send analysis to sidepanel
  sendTabDetails(tabs.get(activeTabId));
});

//------------------------------- Check URL
function preCheck(url, domain) {
  // check if new tab or chrome related tab
  if (url.startsWith("chrome://")) {
    tabs.set(activeTabId, null); // set locally
    sendTabDetails(null); // send to sidepanel
    return false;
  }

  // page reload or navigate through same website, do nothing
  if (tabs.get(activeTabId)?.id == domain) return false;

  // check if domain already exists (checked in another tab)
  for (const value of tabs.values()) {
    if (value?.id === domain) {
      tabs.set(activeTabId, value);
      sendTabDetails(value);
      return false;
    }
  }

  return true;
}

async function doCheck(domain) {
  const summaryTabId = activeTabId; // save tab id since it might change

  // get settings
  const settings = await chrome.storage.local.get(["enableAutoBlock", "enableForceBlock"]);

  // starting check (animations)
  startAnimations(activeTabId);
  tabs.set(summaryTabId, {isLoading: true});
  sendTabDetails(tabs.get(summaryTabId));

  // analyzing website
  const result = await checkUrl(domain);

  // tab might be removed, check first if still exists then apply changes
  if (tabs.has(summaryTabId)) {
    // an error caught send Error to Sidepanel
    if (result?.error != null) sendTabError(result.error);
    else {
      // set locally
      tabs.set(summaryTabId, {
        analysis: result.analysis,
        error: null,
        isLoading: false
      });
      // send back only if we are still in the same tab
      if (summaryTabId == activeTabId) {
        sendTabDetails(tabs.get(activeTabId));

        // block website
        if (settings['enableAutoBlock'] ?? defaults.enableAutoBlock) // Auto block allowed
          if (result.analysis.decision == "Malicious" || (result.analysis.decision == "Suspicious" && (settings['enableForceBlock'] ?? defaults.enableForceBlock)))
            blockTab(activeTabId); //URL is either Malicious (direct block) or Suspicious while Force Block is enabled
      }
    }

    // stop animations
    stopAnimations(summaryTabId);
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
    try {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['DOM_SCRAPING'],
            justification: 'this document is used to communicate with firebase (Auth, Firestore, Functions)',
        });
        await creating;
        creating = null;
    } catch (e) {
        //trying to re-create offscreen document, stop
        creating = null
    }
  }
}