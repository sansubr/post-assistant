document.addEventListener('DOMContentLoaded', () => {
  const providerSelect = document.getElementById('provider-select');
  const apiKeyInput = document.getElementById('api-key-input');
  const addKeyButton = document.getElementById('add-key-button');
  const keyList = document.getElementById('key-list');

  const providers = ['google', 'openai', 'anthropic'];

  // Function to render keys for the selected provider
  const renderKeys = (provider) => {
    chrome.storage.local.get([`${provider}ApiKeys`], (result) => {
      const keys = result[`${provider}ApiKeys`] || [];
      keyList.innerHTML = '';
      keys.forEach((key, index) => {
        const li = document.createElement('li');
        li.textContent = `Key ${index + 1}: ****${key.slice(-4)}`;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
          deleteKey(provider, index);
        });
        li.appendChild(deleteButton);
        keyList.appendChild(li);
      });
    });
  };

  // Function to add a new key
  const addKey = (provider, key) => {
    if (!key) return;
    chrome.storage.local.get([`${provider}ApiKeys`], (result) => {
      const keys = result[`${provider}ApiKeys`] || [];
      keys.push(key);
      chrome.storage.local.set({ [`${provider}ApiKeys`]: keys }, () => {
        apiKeyInput.value = '';
        renderKeys(provider);
      });
    });
  };

  // Function to delete a key
  const deleteKey = (provider, index) => {
    chrome.storage.local.get([`${provider}ApiKeys`], (result) => {
      const keys = result[`${provider}ApiKeys`] || [];
      keys.splice(index, 1);
      chrome.storage.local.set({ [`${provider}ApiKeys`]: keys }, () => {
        renderKeys(provider);
      });
    });
  };

  // Event Listeners
  providerSelect.addEventListener('change', () => {
    renderKeys(providerSelect.value);
  });

  addKeyButton.addEventListener('click', () => {
    addKey(providerSelect.value, apiKeyInput.value.trim());
  });

  // Initial render
  renderKeys(providerSelect.value);
});