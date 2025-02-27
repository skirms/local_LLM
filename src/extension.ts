import * as vscode from 'vscode';
import ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
  const historyKey = 'chatHistory';
  let chatHistory: { question: string; answer: string }[] =
    context.workspaceState.get(historyKey, []);

  const disposable = vscode.commands.registerCommand('local-llm.hi', () => {
    const panel = vscode.window.createWebviewPanel(
      'llmChat',
      'LLM Chat',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent();
    panel.webview.postMessage({ command: 'loadHistory', history: chatHistory });

    panel.webview.onDidReceiveMessage(async (message: any) => {
      if (message.command === 'chat') {
        const userPrompt = message.text;
        let responseText = '';

        try {
          const streamResponse = await ollama.chat({
            model: 'deepseek-r1:1.5b',
            messages: [{ role: 'user', content: userPrompt }],
            stream: true,
          });

          for await (const part of streamResponse) {
            responseText += part.message.content;
            panel.webview.postMessage({
              command: 'chatResponse',
              text: responseText,
            });
          }

          chatHistory.unshift({ question: userPrompt, answer: responseText });
          context.workspaceState.update(historyKey, chatHistory);
          panel.webview.postMessage({
            command: 'loadHistory',
            history: chatHistory,
          });
        } catch (err) {
          panel.webview.postMessage({
            command: 'chatResponse',
            text: `Error: ${String(err)}`,
          });
        }
      }
    });
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <style>
      body { background-color: #1e1e1e; color: #dcdcdc; font-family: sans-serif; margin: 0; display: flex; height: 100vh; }
      #sidebar { width: 25%; background: #252526; padding: 1rem; overflow-y: auto; }
      #chatContainer { width: 75%; display: flex; flex-direction: column; padding: 1rem; }
      #prompt { width: 100%; padding: 0.5rem; background: #333; color: #fff; border: none; }
      #response { flex-grow: 1; border: 1px solid #444; padding: 0.5rem; min-height: 400px; overflow-y: auto; background: #2d2d2d; }
      .history-item { padding: 0.5rem; cursor: pointer; border-bottom: 1px solid #444; }
      .history-item:hover { background: #444; }
    </style>
  </head>
  <body>
    <div id="sidebar">
      <h3>History</h3>
      <div id="history"></div>
    </div>
    <div id="chatContainer">
      <h2>Local LLM Chat</h2>
      <textarea id="prompt" rows="3" placeholder="Ask..."></textarea><br>
      <button id="askBtn">Ask</button>
      <div id="response"></div>
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
        } else if (command === 'loadHistory') {
          const historyContainer = document.getElementById('history');
          historyContainer.innerHTML = '';
          history.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.textContent = item.question;
            div.onclick = () => {
              document.getElementById('prompt').value = item.question;
              document.getElementById('response').innerText = item.answer;
            };
            historyContainer.appendChild(div);
          });
        }
      });
    </script>
  </body>
  </html>`;
}

export function deactivate() {}
