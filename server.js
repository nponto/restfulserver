let express = require('express');
let cors = require('cors'); //https://www.npmjs.com/package/cors
let sqlite3 = require('sqlite3');
let fs = require('fs');
let path = require('path');
let url = require('url');
const bodyParser = require('body-parser');
const { equal } = require('assert');

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


app.get('/api/codes', (req, res) => {
    
    if (Object.keys(req.query).length === 0 ) {
        db.all('SELECT * FROM Codes', (err, rows) => {
            //console.log(rows);
            res.status(200).type('json').send(rows);
        });
    } else {
        console.log(req.query.code);
        let codes = req.query.code.split(',');
        console.log(codes);
        var sql = "SELECT * FROM Codes WHERE code = " + codes[0];
        function extraSQL(arr) { // function to concatenate OR to the sql query syntax
            var string = '';
            for (var i = 1; i < arr.length; i++) {
                string += " OR code = " + arr[i];
            }
            return string;
        }
        sql += extraSQL(codes);
        console.log(sql);
        db.all(sql, (err, rows) => {
            if (err || rows === undefined) {
                res.status(500).send("ERROR: Could not find codes");
            } else {
                console.log(rows);
                res.status(200).type('json').send(rows);
            }
        });
    }
});

app.get('/api/neighborhoods', (req, res) => {
    
    if (Object.keys(req.query).length === 0) {
        db.all('SELECT * FROM Neighborhoods', (err, rows) => {
            res.status(200).type('json').send(rows);
        });
    } else {
        console.log(req.query.id);
        let ids = req.query.id.split(',');
        console.log(ids);
        var sql = "SELECT * FROM Neighborhoods WHERE neighborhood_number = " + ids[0];
        function extraSQL(arr) { // function to concatenate OR to the sql query syntax
            var string = '';
            for (var i = 1; i < arr.length; i++) {
                string += " OR neighborhood_number = " + arr[i];
            }
            return string;
        }
        sql += extraSQL(ids);
        db.all(sql, (err, rows) => {
            if (err || rows === undefined) {
                res.status(500).send("ERROR: Could not find neighborhoods");
            } else {
                console.log(rows);
                res.status(200).type('json').send(rows);
            }
        });
    }
});

app.get('/api/incidents', (req, res) => {
    if (Object.keys(req.query).length === 0) {
        db.all('SELECT * FROM Incidents ORDER BY date_time', (err, rows) => {
            console.log(rows);
            res.status(200).type('json').send(rows);
        });
    } else {

        var sql = 'SELECT * FROM Incidents WHERE ';
        let start = req.query.start_date;
        let end = req.query.end_date;
        let code = req.query.code;
        let neighborhoods = req.query.neighborhood;
        let police_grids = req.query.grid;
        let limit = req.query.limit;
        let base_date = "'2014-08-04'";

        let search = url.parse(req.url, true).search;
        search = search.replace('?', '');
        console.log(search);
        console.log(req.query);

        if (search.includes('start_date') && !(search.includes('end_date'))) {
            sql += 'date_time >= ' + "'" + start + "'";
        } else if (search.includes('end_date') && !(search.includes('start_date'))) {
            sql += 'date_time <= ' + "'" + end + "'";
        } else if ((search.includes('start_date')) && (search.includes('end_date'))) {
            sql += '(date_time BETWEEN ' + "'" + start + "'" + ' AND ' + "'" + end + "')";
        } else {
            sql += 'date_time >= ' + base_date;
            // edit sql so that is it flows correctly into the next query term
        }

        

        if (search.includes('code')) {
            let codes = code.split(',');
            sql += ' AND (code = ' + codes[0];

            function extraSQL(arr) { // function to concatenate OR to the sql query syntax
                var string = '';
                for (var i = 1; i < arr.length; i++) {
                    string += " OR code = " + arr[i];
                }
                return string;
            }
            sql += extraSQL(codes) + ')';
        }

        if (search.includes('grid')) {
            let grids = police_grids.split(',');
            sql += " AND (police_grid = " + grids[0];

            function extraSQL(arr) { // function to concatenate OR to the sql query syntax
                var string = '';
                for (var i = 1; i < arr.length; i++) {
                    string += " OR police_grid = " + arr[i];
                }
                return string;
            }
            sql += extraSQL(grids) + ')';
        }

        if (search.includes('neighborhood')) {
            let ids = neighborhoods.split(',');
            sql += " AND (neighborhood_number = " + ids[0];

            function extraSQL(arr) { // function to concatenate OR to the sql query syntax
                var string = '';
                for (var i = 1; i < arr.length; i++) {
                    string += " OR neighborhood_number = " + arr[i];
                }
                return string;
            }
            sql += extraSQL(ids) + ')';
        }

        sql += ' ORDER BY date_time DESC ';

        if (search.includes('limit')) {
            sql += 'LIMIT ' + limit;
        } else {
            sql += 'LIMIT 1000';
        }

        

        console.log(sql);

        db.all(sql, (err, rows) => {
            if (err || rows === undefined) {
                res.status(500).send("ERROR: Could not find incidents");
            } else {
                console.log('rows is: ' + rows);
                res.status(200).type('json').send(rows);
            }
        });

        
    }
    
});

app.put('/api/new-incident', (req,res) => {
    console.log(req.body);
    db.all('SELECT * FROM Incidents WHERE case_number = ?', [req.body.case_number], (err,rows) => {
        console.log(rows);
        console.log(err);
        if(err || rows !== undefined) {
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

app.delete('/api/remove-incident', (req, res) => {
    console.log(req.body);
    //console.log(req.body.case_number);
    db.all('SELECT * FROM Incidents WHERE case_number =?', [req.body.case_number], (err, row) => {
        if (err || row === undefined)   {
            res.status(500).send("Case does not exist. Unable to delete");
        } else {
            db.all('DELETE FROM Incidents WHERE case_number = ?', [req.body.case_number], (err,rows) => {
                console.log(req.body.case_number);
                console.log(rows);
                //console.log(err);
                if (err) {
                    res.status(500).send("Error when trying to delete incident");
                } else {
                    res.status(200).type('json').send(rows);
                }
            });
        }
    });
    
});


app.listen(port, () => {
    console.log('Now listening on port ' + port);
});