// Enable logging to see what's happening in the console
const DEBUG_MODE = true;

function log(msg, ...args) {
    if (DEBUG_MODE) console.log(`[Gemini Fixer] ${msg}`, ...args);
}

// 1. Generic titles to ignore
const GENERIC_TITLES = [
    "Google Gemini", "Gemini", "Bard", "New chat", "Updates", "Help", 
    "Conversation with Gemini", "Chats"
];

const CHECK_INTERVAL_MS = 1000;

function cleanTitle(text) {
    if (!text) return "";
    // Remove invisible characters, newlines, and suffixes
    return text.replace(/[\u200E\u200F\n]/g, "").replace(/ - Gemini$/, "").trim();
}

function getBestCandidate() {
    const candidates = [];

    // --- Strategy A: Angular Sidebar (The one from your HTML) ---
    // Look for the "selected" conversation item
    const selectedItem = document.querySelector('.conversation.selected .conversation-title');
    if (selectedItem) {
        // log("Found Sidebar (.conversation.selected):", selectedItem.innerText);
        candidates.push(selectedItem.innerText);
    }

    // --- Strategy B: Main Chat Header (Fallback) ---
    // Sometimes the header is an H1 or H2 depending on the page state
    const h1 = document.querySelector('h1');
    if (h1) candidates.push(h1.innerText);
    
    const h2 = document.querySelector('h2');
    if (h2) candidates.push(h2.innerText);

    // --- Strategy C: URL Chat ID (Last Resort) ---
    const urlParts = window.location.pathname.split('/');
    const chatId = urlParts[urlParts.length - 1];
    if (chatId && chatId.length > 10) {
        candidates.push(`Chat ${chatId.slice(-4)}`);
    }

    // Process candidates
    for (const candidate of candidates) {
        const cleaned = cleanTitle(candidate);
        // We accept it if it's NOT generic and has some length
        if (cleaned && cleaned.length > 2 && !GENERIC_TITLES.includes(cleaned)) {
            return cleaned;
        }
    }
    return null;
}

function fixTitle() {
    const currentRaw = document.title;
    const currentClean = cleanTitle(currentRaw);

    const isTemporary = currentClean.startsWith("Chat ") && /\d/.test(currentClean);
    const isGeneric = !currentClean || GENERIC_TITLES.includes(currentClean);

    if (isGeneric || isTemporary) {
        const newTitle = getBestCandidate();
        
        if (newTitle && newTitle !== currentClean) {
            // Anti-loop protection
            if (isTemporary && newTitle === currentClean) return;
            if (isTemporary && GENERIC_TITLES.includes(newTitle)) return;

            log(`Renaming "${currentClean}" -> "${newTitle}"`);
            document.title = newTitle;
        }
    }
}

log("Script loaded (Angular Support added)...");
fixTitle();
setInterval(fixTitle, CHECK_INTERVAL_MS);