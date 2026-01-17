import { ipcMain } from 'electron';
const PouchDB = require('pouchdb-core');
const InMemory = require('pouchdb-adapter-memory');
import * as express from 'express';
import * as expressPouch from 'express-pouchdb';

let server;
PouchDB.plugin(InMemory);

ipcMain.once('appServer', (event, token, port) => {
  const app = express();
  app.use(
    `/${token}/`,
    expressPouch(
      PouchDB.defaults({ adapter: 'memory', revs_limit: 3, auto_compaction: false }),
      { logPath: './data/log.txt', configPath: './data/config.json' }
    )
  );
  server = app.listen(port);
});

ipcMain.once('closeServer', () => {
  if (server !== undefined) {
    server.close();
  }
});
