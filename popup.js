document.addEventListener('DOMContentLoaded', async () => {
  const messageDiv = document.getElementById('message');
  const actionButton = document.getElementById('action-button');
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isYouTubeVideoPage = tab.url && tab.url.includes("youtube.com/watch");

  if (isYouTubeVideoPage) {
    // Check if a transcript is ready for this tab
    chrome.storage.local.get([`transcript_${tab.id}`], (result) => {
      if (result[`transcript_${tab.id}`]) {
        // If transcript is ready, configure and enable the button
        messageDiv.textContent = "A transcript has been captured and is ready.";
        actionButton.textContent = "Create Post from Transcript";
        actionButton.onclick = () => {
          chrome.runtime.sendMessage({ action: "openEditorWithTranscript", tabId: tab.id });
          window.close();
        };
        actionButton.disabled = false; // Enable the button
      } else {
        // If not ready, prompt the user and hide the button
        messageDiv.textContent = "To capture a transcript, enable captions on the video. The icon will show a 'Ready' badge when it's done.";
        actionButton.style.display = 'none';
      }
    });
  } else {
    // For all other pages, configure and enable the button
    messageDiv.textContent = "Click the button to create a post from the content of this page.";
    actionButton.textContent = "Create Post from Page";
    actionButton.onclick = () => {
      chrome.runtime.sendMessage({ action: "createPostFromPage", tabId: tab.id });
      window.close();
    };
    actionButton.disabled = false; // Enable the button
  }
});