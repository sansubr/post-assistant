import { auth } from './firebase-init.js';
import { onAuthStateChanged } from 'firebase/auth';

// The main function now runs when the popup's content has loaded
document.addEventListener('DOMContentLoaded', async () => {
  const actionButton = document.getElementById('action-button');
  const messageDiv = document.getElementById('message');
  if (!actionButton || !messageDiv) return;

  console.log('popup.js: DOMContentLoaded - Starting authentication check.');

  // Get the active tab details FIRST, before doing anything else.
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log('popup.js: Active tab obtained:', tab);

  // Now that we reliably have the tab, check the user's login status.
  onAuthStateChanged(auth, (user) => {
    console.log('popup.js: onAuthStateChanged callback fired. User:', user);
    if (user) {
      console.log('popup.js: User is logged in.');
      // --- If User IS Logged In ---
      const isYouTubeVideoPage = tab.url && tab.url.includes("youtube.com/watch");

      if (isYouTubeVideoPage) {
        // Check if a transcript is ready for this specific tab
        chrome.storage.local.get([`transcript_${tab.id}`], (result) => {
          console.log('popup.js: Checking for transcript. Result:', result);
          if (result[`transcript_${tab.id}`]) {
            messageDiv.textContent = "Transcript is ready!";
            actionButton.textContent = "Create Post from Transcript";
            actionButton.disabled = false;
            actionButton.onclick = () => {
              chrome.runtime.sendMessage({ action: "openEditorWithTranscript", tabId: tab.id });
              window.close();
            };
          } else {
            messageDiv.textContent = "To capture, enable captions & refresh video.";
            actionButton.textContent = "Waiting for Transcript...";
            actionButton.disabled = true;
          }
        });
      } else {
        messageDiv.textContent = "Create a post from this page's content.";
        actionButton.textContent = "Create Post from Page";
        actionButton.disabled = false;
        actionButton.onclick = () => {
          chrome.runtime.sendMessage({ action: "createPostFromPage", tabId: tab.id });
          window.close();
        };
      }
    } else {
      console.log('popup.js: User is NOT logged in.');
      // --- If User IS NOT Logged In ---
      messageDiv.textContent = "Please log in to use Blinkpost.";
      actionButton.textContent = "Login / Sign Up";
      actionButton.disabled = false;
      actionButton.onclick = () => {
        chrome.tabs.create({ url: 'https://blinkpost-ed598.web.app/login.html' });
        window.close();
      };
    }
  });
});