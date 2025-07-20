// Use the Readability library to extract the main article content
var article = new Readability(document.cloneNode(true)).parse();

// Send the clean HTML content directly to our background script
chrome.runtime.sendMessage({ type: 'pageContent', content: article?.content || "" });