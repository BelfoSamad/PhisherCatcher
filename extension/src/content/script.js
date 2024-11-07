// Create Animated Overlay
function createOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "phishsercatcher-overlay";
    document.body.appendChild(overlay);
}

function blockTab() {
    const block = document.createElement("div");
    block.className = "phishsercatcher-block";
    document.body.appendChild(block);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    switch (message.action) {
        case "start_animation":
            createOverlay();
            break;
        case "stop_animation":
            const overlaysByClass = document.getElementsByClassName("phishsercatcher-overlay");
            if (overlaysByClass.length > 0) document.body.removeChild(overlaysByClass[0]);
            break;
        case "block_tab":
            blockTab();
            break;
        case "unblock_tab":
            const blocksByClass = document.getElementsByClassName("phishsercatcher-block");
            if (blocksByClass.length > 0) document.body.removeChild(blocksByClass[0]);
            break;
    }
});