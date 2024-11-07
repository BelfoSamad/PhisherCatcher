// Create Animated Overlay
function createOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "phishsercatcher-overlay";
    document.body.appendChild(overlay);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    switch (message.action) {
        case "start_animation": {
            createOverlay();
            break;
        }
        case "stop_animation": {
            const elementsByClass = document.getElementsByClassName("phishsercatcher-overlay");
            if (elementsByClass.length > 0) document.body.removeChild(elementsByClass[0]);
            break;
        }
    }
});