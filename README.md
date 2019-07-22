# Python Language Server

This is an example language server to use with [zlux-editor](https://github.com/zowe/zlux-editor).

It uses Microsoft's [Python Language Server](https://github.com/microsoft/python-language-server) and proxies it to a socket.

The web service must be 'ls', and must have at least listeners on the root ('/'): one for get requests, to send back information about the language server plugin, and another for websockets, to proxy to the language server.

The information is a js object that must include name (what will be shown in the menu), an array of languages, and an optional 'options' object to send any additional options to the language client.
