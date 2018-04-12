import { ipcMain, webContents } from 'electron';
import * as PouchDB from 'pouchdb';
import * as express from 'express';
import * as expressPouch from 'express-pouchdb';
let server
ipcMain.once('appServer', (event, token, port) => {
    const app = express();
    app.use(`/${token}/`, expressPouch(PouchDB, { logPath: './data/log.txt', configPath: './data/config.json' }));
    const appServer = new PouchDB('appServer');
    server = app.listen(port);
});

ipcMain.once('closeServer', (event) => {
    if(server !== undefined){
        server.close();
    }
});