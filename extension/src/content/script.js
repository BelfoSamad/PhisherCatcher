// Create Animated Overlay
function createOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "phishsercatcher-overlay";
    document.body.appendChild(overlay);
}

function blockTab() {
    const block = document.createElement("div");
    block.className = "phishsercatcher-block";

    const messageContainer = document.createElement("div");
    messageContainer.className = "phishercatcher-block-message";

    // create the image element
    const image = document.createElement("img");
    image.src = "your-image-url.png";

    // Create the text element
    const messageText = document.createElement("p");
    messageText.textContent = "This website has been blocked for your safety.";

    messageContainer.append(image);
    messageContainer.append(messageText);
    block.append(messageContainer);
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
            const blocksByClass = document.getElementsByClassName("phishsercatcher-block");
            if (blocksByClass.length > 0) document.body.removeChild(blocksByClass[0]);
            else blockTab();
            break;
    }
});