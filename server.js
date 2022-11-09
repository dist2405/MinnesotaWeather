// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'mn_weather.sqlite3'); // <-- change this

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
    let home = 'index.html'; // <-- change this
    res.redirect(home);
});


// Example GET request handler for data about a specific year
app.get('/favicon.ico', (req, res) => res.status(204));
let selection_table = "";
let selectionquery = "";
let heading = "";
let nextbutton = "";
let prevbutton = "";
app.get('/:selected_template/', (req, res) => {
    console.log(req.params.selected_template);
    fs.readFile(path.join(template_dir,req.params.selected_template +'.html'), 'utf-8', (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        
        
   
        if(req.params.selected_template = "weather"){
             selectionquery = "SELECT name FROM Types ORDER BY name";
             heading = "Types of Weather Systems";
             nextbutton = "/weather/hail/"
             prevbutton = "/weather/tornado/"
             
             
        }
        else if(req.params.selected_template = "year"){
            selectionquery = "";
        }
        else if(req.params.selected_template = "county"){
            selectionquery = "";
        };
            db.all(selectionquery,(err, rows)=>{
                let i;
                selection_table = '';
                for (i=0;i< rows.length;i++){
                    selection_table = selection_table + ' <option value=' + rows[i].name + '>';
                    selection_table = selection_table  + rows[i].name.replace('"','').replace('"','') + '</option>';
                }
                let response = template.replace('%%SelectionOptions%%',selection_table);
                response = response.replace('%%heading%%',heading);
                response = response.replace('%%next%%',nextbutton);
                response = response.replace('%%previous%%',prevbutton);
                res.status(200).type('html').send(response); 
            });    
    });
});
heading = '';
response = '';

app.get('/:selected_template/:selected_grouping/', (req, res) => {
    fs.readFile(path.join(template_dir,req.params.selected_template +'.html'), 'utf-8', (err, template) => {
        console.log(req.params.selected_template);
        console.log(req.params.selected_grouping);
    if(req.params.selected_template = "weather"){
        selectionquery = "SELECT name FROM Types ";
        heading = req.params.selected_grouping.replace('_',' ');     
   };
  
       db.all(selectionquery,(err, rows) =>{
                selection_table = '';
           let i;
           for (i=0;i< rows.length;i++){
               selection_table = selection_table + ' <option value=' + rows[i].name + '>';
               selection_table = selection_table  + rows[i].name.replace('"','').replace('"','') + '</option>';
           }
           let response = template.replace('%%SelectionOptions%%',selection_table);
           response = response.replace('%%heading%%',heading);
           response = response.replace('%%next%%',nextbutton);
           response = response.replace('%%previous%%',prevbutton);
           res.status(200).type('html').send(response); 
       });    
});

});


app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
