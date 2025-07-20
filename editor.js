import { generatePost } from './ai-service.js';
import { formatForLinkedIn } from '/formatter.js';

window.addEventListener('DOMContentLoaded', () => {
  const sourceContentDiv = document.getElementById('source-content');
  const aiTextarea = document.getElementById('ai-post-content');
  const createPostButton = document.getElementById('create-post-button');
  const copyButton = document.getElementById('copy-button');
  const styleSelect = document.getElementById('prompt-style'); // Get the new dropdown

  chrome.storage.local.get('pageContent', async (data) => {
    console.log("Data retrieved from storage in editor.js:", data); // ADDED: Inspect the data
    if (data.pageContent) {
      sourceContentDiv.innerHTML = data.pageContent.replace(/<img[^>]*>/g, '');
      await chrome.storage.local.remove('pageContent'); // Also making this async to avoid potential race conditions
    } else {
      sourceContentDiv.textContent = 'Could not load content from the page. Please try again from the source page.';
    }
  });

  createPostButton.addEventListener('click', async () => {
    const sourcePlainText = sourceContentDiv.innerText;
    const selectedStyle = styleSelect.value; // Get the selected style
    
    if (!sourcePlainText.trim()) { /* ... same as before ... */ }

    aiTextarea.value = "Getting settings and generating post...";
    createPostButton.disabled = true;
    createPostButton.textContent = 'Generating...';

    const keysToGet = [ 'selectedProvider', 'googleModel', 'openaiModel', 'anthropicModel', 'googleApiKey', 'openaiApiKey', 'anthropicApiKey' ];
    
    chrome.storage.local.get(keysToGet, async (items) => {
      const provider = items.selectedProvider || 'google';
      const apiKeys = {
        google: items.googleApiKey,
        openai: items.openaiApiKey,
        anthropic: items.anthropicApiKey
      };
      const models = {
        google: items.googleModel,
        openai: items.openaiModel,
        anthropic: items.anthropicModel
      };
      const apiKey = apiKeys[provider];
      const model = models[provider];

      if (!apiKey) {
        aiTextarea.value = `API key for AI is not set. Please go to the extension options to set it.`;
        createPostButton.disabled = false;
        createPostButton.textContent = 'Create Post';
        return;
      }
      try {
        // Pass the new 'selectedStyle' to our universal AI function
        const aiGeneratedText = await generatePost(provider, apiKey, model, selectedStyle, sourcePlainText);
        const formattedText = formatForLinkedIn(aiGeneratedText.trim());
        aiTextarea.value = formattedText;
      } catch (error) {
        console.error('Error:', error);
        aiTextarea.value = `Failed to generate post. ${error.message}`;
      } finally {
        createPostButton.disabled = false;
        createPostButton.textContent = 'Create Post';
      }
    });
  });

  copyButton.addEventListener('click', () => {
    const textToCopy = aiTextarea.value;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = copyButton.textContent;
      copyButton.textContent = 'Copied!';
      copyButton.style.backgroundColor = '#28a745'; // Green for success
      setTimeout(() => {
        copyButton.textContent = originalText;
        copyButton.style.backgroundColor = ''; // Revert to default
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  });
});