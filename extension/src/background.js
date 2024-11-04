//------------------------------- Declarations
let creating; // A global promise to avoid concurrency issues

//------------------------------- SidePanel Behavior
chrome.sidePanel
  .setPanelBehavior({openPanelOnActionClick: true})
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

//------------------------------- Handle Communication w/ Popup
chrome.runtime.onMessage.addListener(async function (message, _sender, sendResponse) {
  if (message.action.split("_")[0] == "auth") {
    await setupOffscreenDocument("./offscreen/auth/auth_offscreen.html");
    switch (message.action.split("_")[1]) {
      case "login":
        //const loginRes = await chrome.runtime.sendMessage({target: "offscreen_auth", action: message.action});
        break;
      case "register":
        break;
      case "isLoggedIn":
        break;
      case "logout":
        break;
    }
  } else {
    await setupOffscreenDocument("./offscreen/data/data_offscreen.html");
    switch (message.action.split("_")[1]) {
      case "...":
        break;
    }
  }
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