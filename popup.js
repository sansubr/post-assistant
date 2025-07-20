// This function will run when the popup is opened.
async function initializePopup() {
  const actionButton = document.getElementById('action-button');
  if (!actionButton) return; // Safety check

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // --- This is the final, correct way to check for a YouTube video page ---
  const isYouTubeVideoPage = tab.url && tab.url.includes("youtube.com/watch");

  // Set the button's text and action based on the page type
  if (isYouTubeVideoPage) {
    actionButton.textContent = "Extract Transcript";
    actionButton.onclick = () => {
      chrome.runtime.sendMessage({ action: "createPostFromTranscript", tabId: tab.id });
      window.close();
    };
  } else {
    actionButton.textContent = "Create Post from Page";
    actionButton.onclick = () => {
      chrome.runtime.sendMessage({ action: "createPostFromPage", tabId: tab.id });
      window.close();
    };
  }
}

// Run the initialization function when the popup document has loaded.
document.addEventListener('DOMContentLoaded', initializePopup);