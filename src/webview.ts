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
    <meta charset="UTF-8" />
    <link rel="stylesheet" type="text/css" href="${styleUri}">
  </head>
  <body>
    <div class="container">
      <div id="history-panel">
        <h3>History</h3>
        <div id="history"></div>
      </div>
      <div id="chat-panel">
        <h2>Local LLM Code Extension</h2>
        <textarea id="prompt" rows="3" placeholder="Ask"></textarea><br />
        <button id="askBtn">Ask</button>
        <div id="response"></div>
      </div>
    </div>
    <script>
      const vscode = acquireVsCodeApi();

      document.getElementById('askBtn').addEventListener('click', () => {
        const text = document.getElementById('prompt').value;
        vscode.postMessage({ command: 'chat', text });
      });

      window.addEventListener('message', (event) => {
        const { command, text, history } = event.data;
        
        if (command === 'chatResponse') {
          document.getElementById('response').innerText = text;
        } 
        
        else if (command === 'loadHistory') {
          const historyContainer = document.getElementById('history');
          historyContainer.innerHTML = '';
          history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerText = item.question + ' (' + item.timestamp + ')';
            historyItem.addEventListener('click', () => {
              document.getElementById('prompt').value = item.question;
              vscode.postMessage({ command: 'loadPreviousChat', data: item });
            });
            historyContainer.appendChild(historyItem);
          });
        }
      });
    </script>
  </body>
  </html>
  `;
}
