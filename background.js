// background.js

// Create the menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-gemini-chat",
    title: "Open Chat in New Tab",
    contexts: ["all"],
    documentUrlPatterns: ["https://gemini.google.com/*"]
  });
});

let currentTargetUrl = null;

// Listen for the URL found by content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RIGHT_CLICK_DATA") {
    currentTargetUrl = message.url;
  }
});

// Handle the click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-gemini-chat") {
    if (currentTargetUrl) {
      chrome.tabs.create({ url: currentTargetUrl });
    } else {
      // Fallback if we missed the click target
      console.log("No URL found for this element.");
    }
  }
});