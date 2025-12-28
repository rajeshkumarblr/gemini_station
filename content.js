// content.js - Sync Mode (Fixes Switching)
const GENERIC_TITLES = ["New chat", "Bard", "Gemini", "Google Gemini", "Updates", "Help", "Conversation with Gemini"];

// --- 1. ID EXTRACTOR ---
function getConversationId(target) {
    const jslog = target.getAttribute('jslog');
    if (!jslog) return null;
    const match = jslog.match(/["']c_([a-zA-Z0-9]{10,})["']/);
    if (match && match[1]) return match[1]; 
    return null;
}

// --- 2. GLOBAL BURST CONTROLLER ---
// We use this to trigger aggressive checking after any interaction
let attempts = 0;
const MAX_ATTEMPTS = 15; // Check for 15 seconds after a click

function startBurst() {
    attempts = 0; // Reset counter
    // If a loop isn't already running (optional optimization), this ensures it stays active
}

// --- 3. MOUSE HANDLER (Middle Click + Trigger Update) ---
document.addEventListener("mousedown", (e) => {
    // A. Trigger the Title Fixer Burst on ANY click
    startBurst();

    // B. Handle Middle Click (Button 1)
    if (e.button === 1) {
        const container = e.target.closest('[jslog]');
        if (container) {
            const chatId = getConversationId(container);
            if (chatId) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                window.open(`https://gemini.google.com/app/${chatId}`, '_blank');
            }
        }
    }
}, true);

// --- 4. CONTEXT MENU ---
document.addEventListener("contextmenu", (e) => {
    if (!chrome.runtime || !chrome.runtime.sendMessage) return;
    const container = e.target.closest('[jslog]');
    if (!container) return;

    const chatId = getConversationId(container);
    if (chatId) {
        try {
            chrome.runtime.sendMessage({ type: "RIGHT_CLICK_DATA", url: `https://gemini.google.com/app/${chatId}` });
        } catch (err) {}
    } else {
        try { chrome.runtime.sendMessage({ type: "RIGHT_CLICK_DATA", url: null }); } catch (err) {}
    }
}, true);

// --- 5. TITLE SYNC ENGINE (The Fix) ---
function cleanTitle(text) {
    if (!text) return "";
    return text.replace(/[\u200E\u200F\n]/g, "").trim();
}

function syncTitle() {
    const currentTitle = cleanTitle(document.title);
    let targetTitle = "";

    // Strategy A: Sidebar Selected Item (The Authority)
    const sidebarItem = document.querySelector('.conversation.selected .conversation-title');
    if (sidebarItem) {
        targetTitle = cleanTitle(sidebarItem.innerText);
    }

    // Strategy B: Main Header (Fallback for fresh tabs)
    if (!targetTitle || GENERIC_TITLES.includes(targetTitle)) {
        const h1 = document.querySelector('h1');
        if (h1) targetTitle = cleanTitle(h1.innerText);
    }

    // APPLY: If we found a good title, and it DOES NOT match the current tab title
    if (targetTitle && targetTitle.length > 0 && !GENERIC_TITLES.includes(targetTitle)) {
        if (currentTitle !== targetTitle) {
            // console.log(`[Gemini Station] Syncing Title: "${currentTitle}" -> "${targetTitle}"`);
            document.title = targetTitle;
            return true; // We made a change
        }
    }
    return false; // No change needed
}

// --- 6. THE HEARTBEAT ---

// Fast Loop (Runs frequently when 'attempts' > 0)
setInterval(() => {
    if (attempts < MAX_ATTEMPTS) {
        syncTitle();
        attempts++;
    }
}, 1000); // Check every second during a burst

// Slow Loop (Runs always, just in case)
setInterval(() => {
    // Also restart burst if title becomes generic (e.g. user clicked "New Chat")
    const current = cleanTitle(document.title);
    if (GENERIC_TITLES.some(t => current === t || current.startsWith(t))) {
        startBurst();
    }
    syncTitle();
}, 4000);

// Start immediately
startBurst();