import * as vscode from 'vscode';
import ollama from 'ollama';
import { getWebviewContent } from './webview';

let chatHistory: { question: string; answer: string; timestamp: string }[] = [];

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('local-llm.hi', () => {
    const panel = vscode.window.createWebviewPanel(
      'llmChat',
      'LLM Chat',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = getWebviewContent(panel, context);

    panel.webview.onDidReceiveMessage(async (message: any) => {
      if (message.command === 'chat') {
        const userPrompt = message.text;
        let responseText = '';

        try {
          const streamResponse = await ollama.chat({
            model: 'mistral',
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

          const timestamp = new Date().toISOString();
          chatHistory.unshift({
            question: userPrompt,
            answer: responseText,
            timestamp,
          });
          context.globalState.update('chatHistory', chatHistory);

          panel.webview.postMessage({
            command: 'loadHistory',
            history: chatHistory,
          });
        } catch (err) {
          panel.webview.postMessage({
            command: 'chatResponse',
            text: `⚠️ Error: ${String(
              err
            )}. Please try again or check your connection.`,
          });
        }
      } else if (message.command === 'clearHistory') {
        chatHistory = [];
        context.globalState.update('chatHistory', chatHistory);
        panel.webview.postMessage({
          command: 'loadHistory',
          history: chatHistory,
        });
      } else if (message.command === 'loadPreviousChat') {
        panel.webview.postMessage({
          command: 'chatResponse',
          text: message.data.answer,
        });
      }
    });

    chatHistory = context.globalState.get('chatHistory', []);
    panel.webview.postMessage({ command: 'loadHistory', history: chatHistory });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

// import * as vscode from 'vscode';
// import ollama from 'ollama';
// import { getWebviewContent } from './webview';

// let chatHistory: { question: string; answer: string; timestamp: string }[] = [];

// export function activate(context: vscode.ExtensionContext) {
//   const disposable = vscode.commands.registerCommand('local-llm.hi', () => {
//     const panel = vscode.window.createWebviewPanel(
//       'llmChat',
//       'llm Chat',
//       vscode.ViewColumn.One,
//       { enableScripts: true }
//     );

//     panel.webview.html = getWebviewContent(panel, context);

//     panel.webview.onDidReceiveMessage(async (message: any) => {
//       if (message.command === 'chat') {
//         const userPrompt = message.text;
//         let responseText = '';

//         try {
//           const streamResponse = await ollama.chat({
//             model: 'mistral',
//             // model: 'codellama:13b',
//             // model: 'deepseek-r1:1.5b',
//             messages: [{ role: 'user', content: userPrompt }],
//             stream: true,
//           });

//           for await (const part of streamResponse) {
//             responseText += part.message.content;
//             panel.webview.postMessage({
//               command: 'chatResponse',
//               text: responseText,
//             });
//           }

//           const timestamp = new Date().toISOString();
//           chatHistory.unshift({
//             question: userPrompt,
//             answer: responseText,
//             timestamp,
//           });
//           context.globalState.update('chatHistory', chatHistory);
//           panel.webview.postMessage({
//             command: 'loadHistory',
//             history: chatHistory,
//           });
//         } catch (err) {
//           panel.webview.postMessage({
//             command: 'chatResponse',
//             text: `Error ${String(err)}`,
//           });
//         }
//       } else if (message.command === 'loadPreviousChat') {
//         panel.webview.postMessage({
//           command: 'chatResponse',
//           text: message.data.answer,
//         });
//       }
//     });

//     chatHistory = context.globalState.get('chatHistory', []);
//     panel.webview.postMessage({ command: 'loadHistory', history: chatHistory });
//   });

//   context.subscriptions.push(disposable);
// }

// export function deactivate() {}
