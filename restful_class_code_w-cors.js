let express = require('express');
let cors = require('cors'); //https://www.npmjs.com/package/cors
let sqlite3 = require('sqlite3');
let fs = require('fs');
let path = require('path');
const bodyParser = require('body-parser');

let port = 8000;
let public_dir = path.join(__dirname, 'public');

let app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(public_dir));

let db_filename = path.join(__dirname, 'db', 'cereal.sqlite3');
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if(err) {
        console.log(err);
    } else {
        console.log('connected to database');
    }
});

app.get('/:mfr', (req, res) => {
    fs.readFile(path.join(__dirname, 'cereal_template.html'), 'utf-8', (err, data) => {
        if(err) {
            res.status(404).send('Error: File not Found');
        } else {
            let response = data.replace("{{{MANUFACTURER HERE}}}", req.params.mfr);
            db.all('SELECT name from Cereals WHERE mfr = ?', [req.params.mfr.toUpperCase()[0]], (err, rows) => {
                let i;
                let list_items = '';
                for(i = 0; i < rows.length; i++) {
                    list_items += '<li>' + rows[i].name + '</li>\n';
                }
                response = response.replace('{{{CEREAL LIST HERE}}}', list_items);
                res.status(200).type('html').send(response);
            });
        }
    });
});

//REST API
app.get('/api/cereal/:mfr', (req, res) => {
    db.all('SELECT * FROM Manufacturers WHERE UPPER(name) = ?', [req.params.mfr.toUpperCase()[0]], (err, rows) => {
        db.all('SELECT name from Cereals WHERE mfr = ?', [row.id], (err, rows) => {
            res.status(200).type('json').send(rows);
        });
    });
});

app.get('/api/mfr', (req, res) => {
    db.all('SELECT name FROM Manufacturers', (err, rows) => {
        res.status(200).type('json').send(rows);
    });
});

app.post('/api/mfr', (req, res) => {
    db.get('SELECT * FROM Manufacturers WHERE id=?', [req.body.id], (err, row) => {
        if (err || row !== undefined) {
            res.status(500).type('txt').send('Error, could not insert manufacturer');
        } else {
            //db.run('INSERT INTO Manufacturers (id, name) VALUES (?, ?)', [req.body.id, req.body.n],)
        }
    });
});

app.post('/api/cereal', (req, res) => {
    
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});