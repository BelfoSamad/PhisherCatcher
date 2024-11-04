//------------------------------- Declarations
let creating; // A global promise to avoid concurrency issues

//------------------------------- Starting
setupOffscreenDocument("./offscreen/offscreen.html");
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true})
  .catch((error) => console.error(error));

//------------------------------- Tab Handling
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  //TODO: Handle when webpage changes
});
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  //TODO: Handle when tab is removed
});
chrome.tabs.onActivated.addListener((activeInfo) => {
  //TODO: Handle when tab switch
});

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