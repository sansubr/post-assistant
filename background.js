import { auth } from './firebase-init.js';
import { GoogleAuthProvider, signInWithCredential, signInWithCustomToken } from 'firebase/auth';

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
    title: 'Blinkpost', message: message
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
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "blinkpost",
      title: "Create AI Post from this Page",
      contexts: ["page"],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "blinkpost") {
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

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.token && request.type) {
      let authPromise;

      if (request.type === 'google') {
        // This is a Google ID Token from the web app's direct Google Sign-In
        const googleIdToken = request.token;
        const credential = GoogleAuthProvider.credential(googleIdToken);
        authPromise = signInWithCredential(auth, credential);
      } else if (request.type === 'firebase') {
        // This is a Firebase ID Token from the web app's email/password sign-in/sign-up
        const firebaseIdToken = request.token;
        authPromise = signInWithCustomToken(auth, firebaseIdToken);
      } else {
        console.error("Unknown token type received:", request.type);
        sendResponse({ success: false, error: "Unknown token type" });
        return true;
      }

      authPromise
        .then((userCredential) => {
          console.log("Firebase sign-in successful in background script:", userCredential.user);
          // Store the token securely in the extension's local storage
          chrome.storage.local.set({ 'firebaseIdToken': request.token }, function() {
            if (chrome.runtime.lastError) {
              console.error('Error setting token:', chrome.runtime.lastError);
              sendResponse({ success: false, error: 'Could not save token.' });
            } else {
              console.log('Token saved successfully.');
              sendResponse({ success: true });
            }
          });
        })
        .catch((error) => {
          console.error("Firebase sign-in failed in background script:", error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Indicate that we will send a response asynchronously
    } else if (request.action === 'logout') {
      console.log('Received logout message from web app.');
      auth.signOut()
        .then(() => {
          console.log('Firebase sign-out successful in background script.');
          chrome.storage.local.remove('firebaseIdToken', function() {
            if (chrome.runtime.lastError) {
              console.error('Error removing token from storage:', chrome.runtime.lastError);
            }
            sendResponse({ success: true });
          });
        })
        .catch(error => {
          console.error('Firebase sign-out failed in background script:', error);
          sendResponse({ success: false, error: 'Firebase sign-out failed.' });
        });
      return true;
    }
  }
);

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  processedTabs.delete(tabId);
  chrome.storage.local.remove([`transcript_${tabId}`]);
  try {
    await chrome.action.setBadgeText({ tabId: tabId, text: '' });
  } catch (error) {
    // This error is expected if the tab is closed before the badge is cleared,
    // especially during a browser shutdown. We can safely ignore it.
    if (error.message.includes('No tab with id') || error.message.includes('Invalid tab ID')) {
        // Suppress error
    } else {
        console.error(`Error clearing badge for tab ${tabId}:`, error);
    }
  }
});


// =================================================================
// YouTube Transcript Interception
// =================================================================
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    console.log('webRequest.onBeforeRequest triggered for:', details.url);
    try {
      const tab = await chrome.tabs.get(details.tabId);
      console.log('Tab details obtained:', tab);
      if (!tab.url || !tab.url.includes("youtube.com/watch?v=")) {
        console.log('Not a YouTube video page or missing URL. Returning.');
        return;
      }
      if (processedTabs.has(details.tabId)) {
        console.log('Tab already processed. Returning.');
        return;
      }

      processedTabs.add(details.tabId);
      console.log('Processing transcript URL:', details.url, 'for tabId:', details.tabId);
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
    console.log('handleCreatePostFromPage called for tabId:', tabId);
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["libs/Readability.js"],
    });
    const [extractionResult] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: getArticleContent,
    });
    if (extractionResult && extractionResult.result) {
      console.log('Article content extracted. Setting to storage.');
      await chrome.storage.local.set({ pageContent: extractionResult.result });
      await chrome.tabs.create({ url: "editor.html" });
    } else {
      console.log('Failed to extract article content.');
      showNotification("Failed to extract article content.");
    }
  } catch (error) {
    console.error(`Failed to inject script: ${error}`);
  }
}

async function handleProcessTranscriptUrl(transcriptUrl, tabId) {
  console.log('handleProcessTranscriptUrl called with URL:', transcriptUrl, 'and tabId:', tabId);
  try {
    const url = new URL(transcriptUrl);
    url.searchParams.set('fmt', 'json3');
    console.log('Fetching transcript from:', url.href);

    const response = await fetch(url.href);
    console.log('Transcript fetch response status:', response.status);
    const jsonData = await response.json();
    console.log('Transcript JSON data received.');

    const fullTranscript = jsonData.events
      .filter(e => e.segs)
      .map(e => e.segs.map(s => s.utf8).join(''))
      .join(' ');
    console.log('Full transcript generated. Length:', fullTranscript.length);

    // Save transcript to storage, associated with the tabId
    await chrome.storage.local.set({ [`transcript_${tabId}`]: fullTranscript });
    console.log(`Transcript saved to storage for tab ${tabId}.`);

    // Update the extension icon to show it's ready
    await chrome.action.setBadgeText({ tabId: tabId, text: 'Ready' });
    await chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#4CAF50' });
    showNotification("Transcript captured! Click the extension icon to create a post.");
    console.log('Badge updated and notification shown.');

  } catch (error) {
    if (error.message.includes('No tab with id') || error.message.includes('Invalid tab ID')) {
      console.log(`Tab ${tabId} was closed before transcript processing could complete.`);
    } else {
      console.error("Error processing transcript:", error);
    }
  }
}