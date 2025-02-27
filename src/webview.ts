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
        <h2>Local LLM Code Extension</h2>
        <textarea id="prompt" rows="2" placeholder="Ask something..."></textarea><br>
        <button id="askBtn">Ask</button>
        <button id="copyBtn">Copy Response</button>
        <div id="response"></div>
    </div>
</div>
<script>
    const vscode = acquireVsCodeApi();

    document.getElementById('askBtn').addEventListener('click', () => {
        const text = document.getElementById('prompt').value.trim();
        if (!text) return;
        vscode.postMessage({ command: 'chat', text });
    });

    document.getElementById('clearHistory').addEventListener('click', () => {
        vscode.postMessage({ command: 'clearHistory' });
    });

    document.getElementById('copyBtn').addEventListener('click', () => {
        const responseText = document.getElementById('response').innerText;
        navigator.clipboard.writeText(responseText).then(() => {
            alert('Response copied to clipboard!');
        });
    });

    document.getElementById('searchHistory').addEventListener('input', (event) => {
        const query = event.target.value.toLowerCase();
        document.querySelectorAll('.history-item').forEach(item => {
            item.style.display = item.innerText.toLowerCase().includes(query) ? 'block' : 'none';
        });
    });

    window.addEventListener('message', (event) => {
        const { command, text, history } = event.data;

        if (command === 'chatResponse') {
            document.getElementById('response').innerText = text;
        } else if (command === 'loadHistory') {
            const historyContainer = document.getElementById('history');
            historyContainer.innerHTML = '';
            history.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                const preview = item.question.split(' ').slice(0, 10).join(' ') + (item.question.length > 10 ? '...' : '');
                historyItem.innerText = preview + ' (' + item.timestamp.split('T')[0] + ')';
                historyItem.addEventListener('click', () => {
                    document.getElementById('prompt').value = item.question;
                    vscode.postMessage({ command: 'loadPreviousChat', data: item });
                });
                historyContainer.appendChild(historyItem);
            });
        }
    });

    document.getElementById('prompt').addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
</script>
</body>
</html>`;
}

// import * as vscode from 'vscode';

// export function getWebviewContent(
//   panel: vscode.WebviewPanel,
//   context: vscode.ExtensionContext
// ): string {
//   const styleUri = panel.webview.asWebviewUri(
//     vscode.Uri.joinPath(context.extensionUri, 'src', 'styles.css')
//   );

//   return `
//   <!DOCTYPE html>
//   <html lang="en">
//   <head>
//     <meta charset="UTF-8" />
//     <link rel="stylesheet" type="text/css" href="${styleUri}">
//   </head>
//   <body>
//     <div class="container">
//       <div id="history-panel">
//         <h3>History</h3>
//         <div id="history"></div>
//       </div>
//       <div id="chat-panel">
//         <h2>Local LLM Code Extension</h2>
//         <textarea id="prompt" rows="3" placeholder="Ask"></textarea><br />
//         <button id="askBtn">Ask</button>
//         <div id="response"></div>
//       </div>
//     </div>
//     <script>
//       const vscode = acquireVsCodeApi();

//       document.getElementById('askBtn').addEventListener('click', () => {
//         const text = document.getElementById('prompt').value;
//         vscode.postMessage({ command: 'chat', text });
//       });

//       window.addEventListener('message', (event) => {
//         const { command, text, history } = event.data;

//         if (command === 'chatResponse') {
//           document.getElementById('response').innerText = text;
//         }

//         else if (command === 'loadHistory') {
//           const historyContainer = document.getElementById('history');
//           historyContainer.innerHTML = '';
//           history.forEach(item => {
//             const historyItem = document.createElement('div');
//             historyItem.className = 'history-item';
//             historyItem.innerText = item.question + ' (' + item.timestamp + ')';
//             historyItem.addEventListener('click', () => {
//               document.getElementById('prompt').value = item.question;
//               vscode.postMessage({ command: 'loadPreviousChat', data: item });
//             });
//             historyContainer.appendChild(historyItem);
//           });
//         }
//       });
//     </script>
//   </body>
//   </html>
//   `;
// }
