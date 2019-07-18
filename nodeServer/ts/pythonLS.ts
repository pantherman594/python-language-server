import { Router } from "express-serve-static-core";

import * as express from 'express';
import 'express-ws';
import * as rpc from "vscode-ws-jsonrpc";

import * as path from 'path';
import * as server from "vscode-ws-jsonrpc/lib/server";
import * as lsp from "vscode-languageserver";

class PythonLSService {
  private router: Router;
  
  constructor(context: any){
    let router = express.Router();

    const options = {
      clientOptions: {
        initializationOptions: {
          interpreter: {
            properties: {
              UseDefaultDatabase: true,
              Version: '3.6',
              InterpreterPath: '/usr/bin/python3',
            },
          },
        },
      },
    };

    // Send language server data
    router.get('/', (req, res) => {
      res.status(200).json({
        name: 'Python 3.6',
        languages: ['python'],
        options,
      });
    });

    router.ws('/', (ws, req) => {
      const socket: rpc.IWebSocket = {
        send: content => ws.send(content, error => {
          if (error) {
            throw error;
          }
        }),
        onMessage: cb => ws.on('message', cb),
        onError: cb => ws.on('error', cb),
        onClose: cb => ws.on('close', cb),
        dispose: () => ws.close()
      };
      // launch the server when the web socket is opened
      if (ws.readyState === ws.OPEN) {
        launch(socket);
      } else {
        ws.on('open', () => launch(socket));
      }
    });

    this.router = router;
  }

  getRouter() :Router {
    return this.router;
  }
}

const launch = (socket: rpc.IWebSocket) => {
  const reader = new rpc.WebSocketMessageReader(socket);
  const writer = new rpc.WebSocketMessageWriter(socket);
  // start the language server as an external process
  const extServerPath = path.resolve(__dirname, 'languageServer/Microsoft.Python.LanguageServer.dll');
  const socketConnection = server.createConnection(reader, writer, () => socket.dispose());
  const serverConnection = server.createServerProcess('Python', 'dotnet', ['exec', extServerPath]);
  server.forward(socketConnection, serverConnection, message => {
    if (rpc.isRequestMessage(message)) {
      if (message.method === lsp.InitializeRequest.type.method) {
        const initializeParams = message.params as lsp.InitializeParams;
        initializeParams.processId = process.pid;
      }
    }
    return message;
  });
}

exports.pythonLSRouter = (context: any): Promise<Router> => {
  return new Promise<Router>((resolve, reject) => {
    let dataservice = new PythonLSService(context);
    resolve(dataservice.getRouter());
  });
}
