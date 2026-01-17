"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const express = require("express");
// Use require for packages that might lack types or default exports matching * import
const PouchDB = require('pouchdb-core');
const InMemory = require('pouchdb-adapter-memory');
const expressPouch = require('express-pouchdb');
const cors = require('cors');
const path = require('path');
let server;
PouchDB.plugin(InMemory);
electron_1.ipcMain.once('appServer', (event, token, port) => {
    const app = express();
    app.use(cors()); // Allow CORS
    // Basic config for express-pouchdb
    const pouchApp = expressPouch(PouchDB.defaults({
        adapter: 'memory',
        revs_limit: 3,
        auto_compaction: false,
    }), {
        logPath: path.join(process.cwd(), 'data', 'log.txt'),
        configPath: path.join(process.cwd(), 'data', 'config.json'),
        mode: 'minimumForPouchDB', // Optional: simplified mode
    });
    app.use(`/${token}/`, pouchApp);
    server = app.listen(port, () => {
        console.log(`App Server running on port ${port}`);
    });
});
electron_1.ipcMain.once('closeServer', () => {
    if (server) {
        server.close();
        server = undefined;
    }
});
//# sourceMappingURL=appServer.js.map