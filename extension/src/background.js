import { defaults } from "./configs";

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
    // make the check
    const analysis = await checkUrl(tab.url);
    tabs.set(activeTabId, analysis);
    // send analysis to sidepanel
    chrome.runtime.sendMessage({target: "sidepanel", action: "set_analysis", analysis: tabs[activeTabId]});
    console.log(tabs.get(activeTabId));
  }
});
chrome.tabs.onRemoved.addListener((tabId, _removeInfo) => {
  tabs.delete(tabId);
  console.log(tabs.has(tabId));
});
chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;// update activeTabId
  // the tab is newly created
  if (!tabs.has(activeTabId)) tabs.set(activeTabId, null);
  // send details to sidepanel
  chrome.runtime.sendMessage({target: "sidepanel", action: "set_analysis", analysis: tabs[activeTabId]});
  console.log(tabs.get(activeTabId));
});

//------------------------------- Check URL
async function checkUrl(url) {
  chrome.storage.local.get(["enableAutoScan"], async (res) => {
    console.log("Should Check?");
    if (res['enableAutoScan'] ?? defaults.enableAutoScan) {
      console.log("Checking")
      // extract domain
      const domain = new URL(url).hostname.split(":")[0].toLowerCase();
      // TODO: check if domain is well known
      // check in db/agent
      const analysis = await chrome.runtime.sendMessage({target: "offscreen", action: "check", domain: domain, url: url});
      return analysis;
    } else return null;
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