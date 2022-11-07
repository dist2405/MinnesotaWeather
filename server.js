// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'YOUR_DATABASE_FILE.sqlite3'); // <-- change this

let app = express();
let port = 8000;

// Open SQLite3 database (in read-only mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));


// GET request handler for home page '/' (redirect to desired route)
app.get('/', (req, res) => {
    let home = '/home.html'; // <-- change this
    res.redirect(home);
});


// Example GET request handler for data about a specific year

app.get('/:selected_template/:selected_grouping', (req, res) => {
    console.log(req.params.selected_grouping);

    fs.readFile(path.join(template_dir,req.params.selected_template, '.html'), (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database

        if(req.params.selected_template = "weather"){

        };
        res.status(200).type('html').send(template); // <-- you may need to change this
    });
});


app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
