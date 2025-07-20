// This new async function dynamically loads the correct prompt "package"
async function getPrompts(style, sourcePlainText) {
  const path = `./prompts/${style}.js`;
  const promptModule = await import(path);
  const promptPackage = promptModule.default; // Get the exported { system, user } object

  const systemPrompt = promptPackage.system;
  const userPrompt = promptPackage.user(sourcePlainText);

  return { systemPrompt, userPrompt };
}

async function callGoogleApi(apiKey, model, sourcePlainText, style) {
  const { systemPrompt, userPrompt } = await getPrompts(style, sourcePlainText);
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ "contents": [{ "parts": [{ "text": fullPrompt }] }] }) });
    if (!response.ok) throw new Error((await response.json()).error.message);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    throw new Error(`Google API call failed: ${error.message}`);
  }
}

async function callOpenAiApi(apiKey, model, sourcePlainText, style) {
  const { systemPrompt, userPrompt } = await getPrompts(style, sourcePlainText);
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model: model, messages: [{ "role": "system", content: systemPrompt }, { "role": "user", content: userPrompt }] }) });
  if (!response.ok) throw new Error((await response.json()).error.message);
  const data = await response.json();
  // Check for the specific location of the message content
  if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
    return data.choices[0].message.content;
}

async function callAnthropicApi(apiKey, model, sourcePlainText, style) {
  const { systemPrompt, userPrompt } = await getPrompts(style, sourcePlainText);
  const response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: model, max_tokens: 2048, system: systemPrompt, messages: [{ "role": "user", content: userPrompt }] }) });
  if (!response.ok) throw new Error((await response.json()).error.message);
  const data = await response.json();
  return data.content[0].text;
}

// The main dispatcher function remains the same
export async function generatePost(provider, apiKey, model, style, sourcePlainText) {
  switch (provider) {
    case 'google':
      return callGoogleApi(apiKey, model, sourcePlainText, style);
    case 'openai':
      return callOpenAiApi(apiKey, model, sourcePlainText, style);
    case 'anthropic':
      return callAnthropicApi(apiKey, model, sourcePlainText, style);
    default:
      throw new Error('Unsupported AI provider selected.');
  }
}