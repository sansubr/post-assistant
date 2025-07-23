import { generatePost } from './ai-service.js';
import { formatForLinkedIn } from './formatter.js';

window.addEventListener('DOMContentLoaded', () => {
  const sourceContentDiv = document.getElementById('source-content');
  const aiTextarea = document.getElementById('ai-post-content');
  const createPostButton = document.getElementById('create-post-button');
  const copyButton = document.getElementById('copy-button');
  const styleSelect = document.getElementById('prompt-style');
  const modelSelect = document.getElementById('model-select');
  const wordCountDisplay = document.getElementById('word-count-display');

  const MAX_WORDS = 3000;

  function updateWordCount() {
    const text = sourceContentDiv.innerText;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    wordCountDisplay.textContent = `Word count: ${wordCount} / ${MAX_WORDS}`;

    if (wordCount > MAX_WORDS) {
      wordCountDisplay.style.color = 'red';
      createPostButton.disabled = true;
      aiTextarea.value = `Source content is too long (${wordCount} words). Please reduce it to ${MAX_WORDS} words or less.`;
    } else {
      wordCountDisplay.style.color = '';
      createPostButton.disabled = false;
      if (aiTextarea.value.startsWith('Source content is too long')) {
        aiTextarea.value = ''; // Clear the warning if user reduced text
      }
    }
  }

  const models = {
    google: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'],
    openai: ['gpt-4.1-mini-2025-04-14', 'gpt-4.1-2025-04-14', 'gpt-4o-2024-08-06'],
    anthropic: ['claude-3-opus-20240229', 'claude-sonnet-4-20250514', ]
  };

  // Populate the model dropdown
  for (const provider in models) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = provider.charAt(0).toUpperCase() + provider.slice(1);
    models[provider].forEach(model => {
      const option = document.createElement('option');
      option.value = `${provider}:${model}`;
      option.textContent = model;
      optgroup.appendChild(option);
    });
    modelSelect.appendChild(optgroup);
  }

  // Initial population and word count check
  chrome.storage.local.get('pageContent', (data) => {
    if (data.pageContent) {
      sourceContentDiv.innerHTML = data.pageContent.replace(/<img[^>]*>/g, '');
      chrome.storage.local.remove('pageContent');
    } else {
      sourceContentDiv.textContent = 'Could not load content from the page. Please try again from the source page.';
    }
    updateWordCount(); // Initial word count check
  });

  // Update word count on input
  sourceContentDiv.addEventListener('input', updateWordCount);

  createPostButton.addEventListener('click', async () => {
    if (createPostButton.disabled) {
      return; // Do nothing if the button is disabled
    }
    const sourcePlainText = sourceContentDiv.innerText;
    const selectedStyle = styleSelect.value;
    const [provider, model] = modelSelect.value.split(':');

    if (!sourcePlainText.trim()) {
      aiTextarea.value = 'Source content is empty.';
      return;
    }

    aiTextarea.value = "Generating post...";
    createPostButton.disabled = true;
    createPostButton.textContent = 'Generating...';

    chrome.storage.local.get([`${provider}ApiKeys`], async (items) => {
      const apiKeys = items[`${provider}ApiKeys`];
      if (!apiKeys || apiKeys.length === 0) {
        aiTextarea.value = `No API key found for ${provider}. Please add one in the options.`;
        createPostButton.disabled = false;
        createPostButton.textContent = 'Create Post';
        return;
      }

      // For simplicity, using the first available key
      const apiKey = apiKeys[0];

      try {
        const aiGeneratedText = await generatePost(provider, apiKey, model, selectedStyle, sourcePlainText);
        const formattedText = formatForLinkedIn(aiGeneratedText.trim());
        aiTextarea.value = formattedText;

        // Save to history
        chrome.storage.local.get(['postHistory'], (result) => {
          const history = result.postHistory || [];
          history.push({ content: formattedText, timestamp: new Date().toISOString() });
          chrome.storage.local.set({ postHistory: history });
        });

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
    navigator.clipboard.writeText(aiTextarea.value).then(() => {
      copyButton.textContent = 'Copied!';
      setTimeout(() => { copyButton.textContent = 'Copy Post'; }, 2000);
    });
  });
});