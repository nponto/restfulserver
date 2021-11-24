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

let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if(err) {
        console.log(err);
    } else {
        console.log('connected to database');
    }
});

/*
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
*/

//REST API

/*
app.get('/api/cereal/:mfr', (req, res) => {
    db.get('SELECT * FROM Manufacturers WHERE UPPER(name) = ?', [req.params.mfr.toUpperCase()], (err, row) => {
        console.log(row);
        db.all('SELECT * from Cereals WHERE mfr = ?', [row.id], (err, rows) => {
            console.log(rows);
            res.status(200).type('json').send(rows);
        });
    });
});
*/

app.get('/api/codes', (req, res) => {
    db.all('SELECT * FROM Codes', (err, rows) => {
        console.log(rows);
        res.status(200).type('json').send(rows);
    });
});

app.get('/api/neighborhoods', (req, res) => {
    db.all('SELECT * FROM Neighborhoods', (err, rows) => {
        console.log(rows);
        res.status(200).type('json').send(rows);
    });
});

app.get('/api/incidents', (req, res) => {
    db.all('SELECT * FROM Incidents ORDER BY date_time', (err, rows) => {
        console.log(rows);
        res.status(200).type('json').send(rows);
    });
});

app.put('/api/new-incident', (req,res) => {
    console.log(req.body);
    db.get('SELECT * FROM Incidents WHERE case_number = ?', [req.body.case_number], (err,row) => {
        console.log(row);
        console.log(err);
        if(err || row !== undefined) {
            res.status(500).send("ERROR: could not insert new incident! (case number conflict)");
        } else {
            db.run("INSERT INTO Incidents (case_number,date_time,code,incident,police_grid,neighborhood_number,block) VALUES (?,?,?,?,?,?,?)", [req.body.case_number,req.body.date_time,req.body.code,req.body.incident,req.body.police_grid,req.body.neighborhood_number,req.body.block], (err) => {
                if(err) {
                    res.status(404).send("ERROR: parameters are not correct! (OR I screwed something up)");
                } else {
                    console.log("SUCCESSFULLY added new entry!");
                }
            })
        }
    });
});

app.delete('/api/remove-incident/:case_number', (req, res) => {
    db.all('DELETE FROM Incident WHERE case_number = ?', [req.params.case_number], (err, rows) => {
        console.log(rows);
        if (err) {
            res.status(500).send("Error when trying to delete");
        } else {
            res.status(200).type('json').send(rows);
        }
    });
});

/*
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
*/
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});