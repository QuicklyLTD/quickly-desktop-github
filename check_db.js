
const PouchDB = require('pouchdb');
const db = new PouchDB('local_settings');
db.allDocs({include_docs: true}).then(res => {
    console.log('Settings Documents:', JSON.stringify(res.rows.map(r => r.doc), null, 2));
    process.exit(0);
}).catch(err => {
    console.error('Error reading settings:', err);
    process.exit(1);
});
