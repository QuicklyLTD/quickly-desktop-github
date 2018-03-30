import { ipcMain, webContents } from 'electron';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { request } from 'http';

let observableData;
const server = express();
ipcMain.on('appServer', (event, data) => {
    observableData = data;
});

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.get('/db', (req, res) => {
    let responseFromApp
    if (observableData) {
        responseFromApp = observableData;
    } else {
        responseFromApp = [];
    }
    res.send(responseFromApp);
});

server.get('/db/:name', (req, res) => {
    const requestedDB = req.params.name;
    let responseFromApp
    if (observableData) {
        responseFromApp = observableData.filter(obj => obj.db_name == requestedDB);
    } else {
        responseFromApp = [];
    }
    res.send(responseFromApp);
});

server.post('/add/:dbname', (req, res) => {
    const requestedDB = req.params.dbname;
    const docWillAdd = req.body;
    webContents.getAllWebContents()[0].send('serverListener', 'add', requestedDB, docWillAdd);
    res.send(req.body);
});

server.put('/update/:dbname/:doc', (req, res) => {
    const requestedDB = req.params.dbname;
    const docId = req.params.doc;
    const schema = req.body;
    webContents.getAllWebContents()[0].send('serverListener', 'update', requestedDB, docId, schema);
    res.send(req.body.username);
});

server.delete('/remove/:dbname/:doc', (req, res) => {
    const requestedDB = req.params.dbname;
    const docId = req.params.doc;
    webContents.getAllWebContents()[0].send('serverListener', 'remove', requestedDB, docId);
    res.send(JSON.stringify(req.body));
});

server.listen(3000, () => { });