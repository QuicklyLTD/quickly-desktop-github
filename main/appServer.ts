import { ipcMain } from 'electron';
import * as PouchDB from 'pouchdb';
import * as InMemory from 'pouchdb-adapter-memory';
import * as express from 'express';
import * as expressPouch from 'express-pouchdb';
import * as cors from 'cors';

let server;
PouchDB.plugin(InMemory);

ipcMain.once('appServer', (event, token, port) => {
    const app = express();
    // app.use(cors({ origin: 'http://localhost:8000', credentials: true }));
    // app.use(function (req, res, next) {
    //     res.header('Access-Control-Allow-Origin', req.header('origin'));
    //     next();
    // });
    app.use(`/${token}/`, expressPouch(PouchDB.defaults({ adapter: 'memory', revs_limit: 3, auto_compaction: false }), { logPath: './data/log.txt', configPath: './data/config.json' }));
    server = app.listen(port);
});

ipcMain.once('closeServer', (event) => {
    if (server !== undefined) {
        server.close();
    }
});