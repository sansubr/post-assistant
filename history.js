document.addEventListener('DOMContentLoaded', () => {
  const historyList = document.getElementById('history-list');

  chrome.storage.local.get(['postHistory'], (result) => {
    const history = result.postHistory || [];
    if (history.length === 0) {
      historyList.innerHTML = '<li>No posts generated yet.</li>';
      return;
    }

    history.reverse().forEach(item => {
      const li = document.createElement('li');
      const timestamp = new Date(item.timestamp).toLocaleString();
      li.innerHTML = `<strong>${timestamp}</strong><br><pre>${item.content}</pre>`;
      historyList.appendChild(li);
    });
  });
});