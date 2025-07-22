// =================================================================
// Global State
// =================================================================
// A set to keep track of tabs for which a transcript has already been captured.
const processedTabs = new Set();


// =================================================================
// Helper Functions
// =================================================================
function showNotification(message) {
  chrome.notifications.create({
    type: 'basic', iconUrl: 'icons/icon128.png',
    title: 'Get Strategiq AI Assistant', message: message
  });
}

function getArticleContent() {
  const article = new Readability(document.cloneNode(true)).parse();
  return article.content;
}


// =================================================================
// Event Listeners (Setup)
// =================================================================
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "strategiq-post-assistant",
    title: "Create AI Post from this Page",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "strategiq-post-assistant") {
    handleCreatePostFromPage(tab.id);
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "createPostFromPage") {
    handleCreatePostFromPage(request.tabId);
  } else if (request.action === "openEditorWithTranscript") {
    // New action to open the editor from the popup
    chrome.storage.local.get([`transcript_${request.tabId}`], (result) => {
      if (result[`transcript_${request.tabId}`]) {
        chrome.storage.local.set({ pageContent: result[`transcript_${request.tabId}`] }, () => {
          chrome.tabs.create({ url: "editor.html" });
        });
      }
    });
  }
  return true;
});

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  processedTabs.delete(tabId);
  chrome.storage.local.remove([`transcript_${tabId}`]);
  chrome.action.setBadgeText({ tabId: tabId, text: '' });
});


// =================================================================
// YouTube Transcript Interception
// =================================================================
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    try {
      const tab = await chrome.tabs.get(details.tabId);
      if (!tab.url || !tab.url.includes("youtube.com/watch?v=")) return;
      if (processedTabs.has(details.tabId)) return;

      processedTabs.add(details.tabId);
      handleProcessTranscriptUrl(details.url, details.tabId); // Pass tabId

    } catch (error) {
      console.log(`Could not get tab details for tabId ${details.tabId}: ${error}`);
    }
  },
  { urls: ["*://*.youtube.com/api/timedtext*"] }
);


// =================================================================
// Handler Functions
// =================================================================

async function handleCreatePostFromPage(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["libs/Readability.js"],
    });
    const [extractionResult] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: getArticleContent,
    });
    if (extractionResult && extractionResult.result) {
      await chrome.storage.local.set({ pageContent: extractionResult.result });
      await chrome.tabs.create({ url: "editor.html" });
    } else {
      showNotification("Failed to extract article content.");
    }
  } catch (error) {
    console.error(`Failed to inject script: ${error}`);
  }
}

async function handleProcessTranscriptUrl(transcriptUrl, tabId) {
  try {
    const url = new URL(transcriptUrl);
    url.searchParams.set('fmt', 'json3');

    const response = await fetch(url.href);
    const jsonData = await response.json();

    const fullTranscript = jsonData.events
      .filter(e => e.segs)
      .map(e => e.segs.map(s => s.utf8).join(''))
      .join(' ');

    // Save transcript to storage, associated with the tabId
    await chrome.storage.local.set({ [`transcript_${tabId}`]: fullTranscript });

    // Update the extension icon to show it's ready
    chrome.action.setBadgeText({ tabId: tabId, text: 'Ready' });
    chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#4CAF50' });
    showNotification("Transcript captured! Click the extension icon to create a post.");

  } catch (error) {
    console.error("Error processing transcript:", error);
  }
}