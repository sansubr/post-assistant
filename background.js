// =================================================================
// Helper Function
// =================================================================
function showNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Get Strategiq AI Assistant',
    message: message
  });
}

// This function is injected into a regular webpage to get its main content.
function getArticleContent() {
  const article = new Readability(document.cloneNode(true)).parse();
  return article.content;
}


// =================================================================
// Event Listeners
// =================================================================

// 1. Listen for extension installation to create the right-click menu.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "strategiq-post-assistant",
    title: "Create AI Post from this Page",
    contexts: ["page"],
  });
});

// 2. Silently capture YouTube transcripts from network requests.
chrome.webRequest.onCompleted.addListener(
  async function(details) {
    try {
      const response = await fetch(details.url);
      const rawText = await response.text();
      if (rawText && rawText.trim().startsWith('{')) {
        await chrome.storage.local.set({ pageContent: rawText });
        console.log("Transcript successfully captured and saved in the background.");
      }
    } catch (err) {
      // Fail silently in the background
    }
  },
  // --- This is the new, corrected URL filter ---
  { urls: ["*://*.youtube.com/*7"] }
);

// 3. Listen for clicks on the right-click menu.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "strategiq-post-assistant") {
    handleCreatePostFromPage(tab.id);
  }
});

// 4. Listen for messages from the popup.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "createPostFromPage") {
    handleCreatePostFromPage(request.tabId);
  } else if (request.action === "createPostFromTranscript") {
    handleCreatePostFromTranscript();
  }
  return true;
});


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
      showNotification("Failed to extract article content from this page.");
    }
  } catch (error) {
    console.error(`Failed to inject script or create post: ${error}`);
  }
}

async function handleCreatePostFromTranscript() {
  try {
    const storedData = await chrome.storage.local.get('pageContent');
    const rawText = storedData.pageContent;

    if (!rawText) {
      return showNotification('No transcript was captured. Please ensure the video has captions and refresh the page.');
    }

    let jsonData;
    try {
      jsonData = JSON.parse(rawText);
    } catch (e) {
      return showNotification('Captured transcript data was not in a readable format.');
    }

    const fullTranscript = jsonData.events
      .filter(e => e.segs)
      .map(e => e.segs.map(s => s.utf8).join(''))
      .join(' ');

    await chrome.storage.local.set({ pageContent: fullTranscript });
    await chrome.tabs.create({ url: "editor.html" });

  } catch (error) {
    showNotification(`Failed to process the captured transcript.`);
  }
}