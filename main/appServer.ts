import { ipcMain, webContents } from 'electron';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { request } from 'http';

let observableData;
const server = express();
ipcMain.on('appServer', (event, data) => {
    observableData = data;
});

server.get('/db/:name', (req, res) => {
    const requestedDB = req.params.name;
    let responseFromApp
    if (observableData) {
        responseFromApp = observableData.filter(obj => obj.db_name == requestedDB);
    } else {
        responseFromApp = "Bulunamadı!";
    }
    res.send(responseFromApp);
});

server.post('/add/:dbname', (req, res) => {
    const requestedDB = req.params.dbname;
    const docWillAdd = req.params.doc;
    // webContents.getAllWebContents()[1].send('serverListener', 'add', requestedDB, docWillAdd);
    console.log(req.body);
    res.send(req.body);
});

server.put('/update/:dbname/:doc', (req, res) => {
    const requestedDB = req.params.dbname;
    const docWillUpdate = req.params.doc;
    //webContents.getAllWebContents()[1].send('serverListener', 'update', requestedDB, docWillUpdate);
    res.send(req.body.username);
});

server.delete('/remove/:dbname/:doc', (req, res) => {
    const requestedDB = req.params.dbname;
    const docWillRemove = req.params.doc;
    //webContents.getAllWebContents()[1].send('serverListener', 'remove', requestedDB, docWillRemove);
    res.send(JSON.stringify(req.body));
});

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.listen(3000, () => { });