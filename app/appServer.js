"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const PouchDB = require('pouchdb-core');
const InMemory = require('pouchdb-adapter-memory');
const express = require("express");
const expressPouch = require("express-pouchdb");
let server;
PouchDB.plugin(InMemory);
electron_1.ipcMain.once('appServer', (event, token, port) => {
    const app = express();
    app.use(`/${token}/`, expressPouch(PouchDB.defaults({ adapter: 'memory', revs_limit: 3, auto_compaction: false }), { logPath: './data/log.txt', configPath: './data/config.json' }));
    server = app.listen(port);
});
electron_1.ipcMain.once('closeServer', () => {
    if (server !== undefined) {
        server.close();
    }
});
//# sourceMappingURL=appServer.js.map