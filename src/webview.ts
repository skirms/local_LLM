import * as vscode from 'vscode';

export function getWebviewContent(
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext
): string {
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'src', 'styles.css')
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div class="container">
    <div id="history-panel">
      <h3>History</h3>
      <input type="text" id="searchHistory" placeholder="Search history..." />
      <div id="history"></div>
      <button id="clearHistory">Clear History</button>
    </div>
    <div id="chat-panel">
      <h2>Your Local LLM</h2>
      <textarea id="prompt" rows="2" placeholder="Ask something..."></textarea><br>
      <button id="askBtn">Ask</button>
      <button id="copyBtn">Copy Response</button>
      <div id="response"></div>
    </div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const promptInput = document.getElementById('prompt');
    const responseDiv = document.getElementById('response');
    const historyContainer = document.getElementById('history');
    const searchHistoryInput = document.getElementById('searchHistory');

    document.getElementById('askBtn').addEventListener('click', () => {
      const userInput = promptInput.value.trim();
      if (userInput) {
        vscode.postMessage({ command: 'chat', text: userInput });
      }
    });

    document.getElementById('clearHistory').addEventListener('click', () => {
      vscode.postMessage({ command: 'clearHistory' });
    });

    document.getElementById('copyBtn').addEventListener('click', () => {
      const responseText = responseDiv.innerText;
      navigator.clipboard.writeText(responseText).then(() => {
        alert('Copied to clipboard!');
      });
    });

    searchHistoryInput.addEventListener('input', (event) => {
      const query = event.target.value.toLowerCase();
      document.querySelectorAll('.history-item').forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(query) ? 'block' : 'none';
      });
    });

    promptInput.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });

    window.addEventListener('message', (event) => {
      const { command, text, history } = event.data;

      if (command === 'chatResponse') {
        responseDiv.innerText = text;
      } else if (command === 'loadHistory') {
        updateHistory(history);
      }
    });

    function updateHistory(history) {
      historyContainer.innerHTML = '';
      
      history.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const preview = item.question.split(' ').slice(0, 10).join(' ');
        const date = item.timestamp.split('T')[0];
        const previewElement = document.createElement('span');
        previewElement.textContent = preview + ' (' + date + ')';

        const deleteButton = document.createElement('span');
        deleteButton.className = 'delete-history';
        deleteButton.textContent = '✖';
        deleteButton.dataset.index = index;

        deleteButton.addEventListener('click', (event) => {
          event.stopPropagation();
          vscode.postMessage({ command: 'deleteHistory', index });
        });

        historyItem.addEventListener('click', () => {
          promptInput.value = item.question;
          vscode.postMessage({ command: 'loadPreviousChat', data: item });
        });

        historyItem.appendChild(previewElement);
        historyItem.appendChild(deleteButton);
        historyContainer.appendChild(historyItem);
      });
    }
  </script>
</body>
</html>`;
}
