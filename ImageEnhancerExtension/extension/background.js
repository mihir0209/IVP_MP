// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "enhanceImage",
        title: "Enhance Image",
        contexts: ["image"]
    });

    // Existing cleanup code
    setInterval(() => {
        chrome.storage.local.get(['enhanced_images'], (result) => {
            if (result.enhanced_images) {
                const now = Date.now();
                const filteredImages = result.enhanced_images.filter(
                    img => (now - img.timestamp) <= 86400000
                );
                
                if (filteredImages.length !== result.enhanced_images.length) {
                    chrome.storage.local.set({ 'enhanced_images': filteredImages });
                }
            }
        });
    }, 3600000);
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "enhanceImage") {
        try {
            const response = await fetch(info.srcUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const imageData = reader.result;
                chrome.storage.local.set({ 'pendingImage': imageData }, () => {
                    chrome.sidePanel.open({ windowId: tab.windowId });
                });
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error loading image:', error);
        }
    }
});
// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
    await chrome.sidePanel.open({ windowId: tab.windowId });
});
