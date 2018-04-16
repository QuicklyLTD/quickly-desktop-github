import { ipcMain, webContents } from 'electron';
import * as PouchDB from 'pouchdb';
import * as InMemory from 'pouchdb-adapter-memory';
import * as express from 'express';
import * as expressPouch from 'express-pouchdb';

let server
PouchDB.plugin(InMemory);

ipcMain.once('appServer', (event, token, port) => {
    const app = express();
    app.use(`/${token}/`, expressPouch(PouchDB.defaults({ adapter: 'memory' }), { logPath: './data/log.txt', configPath: './data/config.json' }));
    const appServer = new PouchDB('./data/appServer');
    server = app.listen(port);
});

ipcMain.once('closeServer', (event) => {
    if (server !== undefined) {
        server.close();
    }
});