import {defaults} from "./configs";

//------------------------------- Declarations
let creating; // A global promise to avoid concurrency issues
let activeTabId = -1;
let userLoggedIn = false;
const tabs = new Map();

//------------------------------- Starting
setupOffscreenDocument("./offscreen/offscreen.html");
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true})
  .catch((error) => console.error(error));
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
      // make the check
      const analysis = await checkUrl(tab.url);
      tabs.set(activeTabId, analysis);
      // send analysis to sidepanel
      chrome.runtime.sendMessage({target: "sidepanel", action: "analysis", analysis: tabs[activeTabId], allowCheck: analysis == undefined});
    }
  }
});
chrome.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  tabs.delete(tabId);
});
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;// update activeTabId
  // the tab is newly created
  if (!tabs.has(activeTabId)) tabs.set(activeTabId, undefined);
  // send details to sidepanel
  chrome.runtime.sendMessage({target: "sidepanel", action: "analysis", analysis: tabs[activeTabId], allowCheck: false});
});

//------------------------------- Check URL
function preCheck(url, domain) {
  // check if new tab or chrome related tab
  if (url.startsWith("chrome://") || domain === "newtab") {
    tabs.set(activeTabId, null);
    chrome.runtime.sendMessage({target: "sidepanel", action: "analysis", analysis: tabs[activeTabId]});
    return false;
  }

  // reload check, do nothing
  if (tabs[activeTabId].id == domain) return false;

  // check if domain already exists
  for (const value of tabs.values()) {
    if (value.id === domain) {
      tabs.set(activeTabId, value);
      chrome.runtime.sendMessage({target: "sidepanel", action: "analysis", analysis: tabs[activeTabId]});
      return false;
    }
  }

  return true;
}

async function checkUrl(domain) {
  chrome.storage.local.get(["enableAutoScan"], async (res) => {
    if (res['enableAutoScan'] ?? defaults.enableAutoScan) {
      // TODO: check if domain is well known
      // check in db/agent
      const analysis = await chrome.runtime.sendMessage({target: "offscreen", action: "check", domain: domain});
      return analysis;
    } else return undefined;
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