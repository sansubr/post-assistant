const providerSelect = document.getElementById('ai-provider');
const saveButton = document.getElementById('save-button');
const statusDiv = document.getElementById('status');

const providerFields = {
  google: document.getElementById('google-fields'),
  openai: document.getElementById('openai-fields'),
  anthropic: document.getElementById('anthropic-fields')
};

const inputs = {
  googleModel: document.getElementById('google-model'),
  openaiModel: document.getElementById('openai-model'),
  anthropicModel: document.getElementById('anthropic-model'),
  googleApiKey: document.getElementById('google-api-key'),
  openaiApiKey: document.getElementById('openai-api-key'),
  anthropicApiKey: document.getElementById('anthropic-api-key')
};

function toggleProviderFields() {
  const selectedProvider = providerSelect.value;
  for (const provider in providerFields) {
    providerFields[provider].style.display = provider === selectedProvider ? 'block' : 'none';
  }
}

function saveOptions() {
  const settings = {
    selectedProvider: providerSelect.value,
    googleModel: inputs.googleModel.value,
    openaiModel: inputs.openaiModel.value,
    anthropicModel: inputs.anthropicModel.value,
    googleApiKey: inputs.googleApiKey.value,
    openaiApiKey: inputs.openaiApiKey.value,
    anthropicApiKey: inputs.anthropicApiKey.value
  };

  chrome.storage.local.set(settings, () => {
    statusDiv.textContent = 'Settings saved.';
    setTimeout(() => { statusDiv.textContent = ''; }, 1500);
  });
}

function restoreOptions() {
  const keysToGet = [
    'selectedProvider', 'googleModel', 'openaiModel', 'anthropicModel',
    'googleApiKey', 'openaiApiKey', 'anthropicApiKey'
  ];
  chrome.storage.local.get(keysToGet, (items) => {
    providerSelect.value = items.selectedProvider || 'google';
    
    // --- CORRECTED DEFAULT VALUES ---
    inputs.googleModel.value = items.googleModel || 'gemini-2.5-pro';
    inputs.openaiModel.value = items.openaiModel || 'gpt-4o';
    inputs.anthropicModel.value = items.anthropicModel || 'claude-sonnet-4-20250514';
    
    inputs.googleApiKey.value = items.googleApiKey || '';
    inputs.openaiApiKey.value = items.openaiApiKey || '';
    inputs.anthropicApiKey.value = items.anthropicApiKey || '';
    
    toggleProviderFields();
  });
}

providerSelect.addEventListener('change', toggleProviderFields);
saveButton.addEventListener('click', saveOptions);
document.addEventListener('DOMContentLoaded', restoreOptions);