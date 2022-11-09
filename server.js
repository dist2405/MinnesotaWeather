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


// Example GET request handler for data about a specific template
app.get('/favicon.ico', (req, res) => res.status(204));
let selection_table = "";
let summary_table = '';
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
             selectionquery = "SELECT name,SUM(deaths_direct) AS deaths_direct , SUM(deaths_indirect) AS deaths_indirect\
             ,SUM(damage_property ) AS damage_property,SUM(damage_crops) AS damage_crops, SUM(injuries_direct) AS injuries_direct\
             , SUM(injuries_indirect) as injuries_indirect FROM Users LEFT JOIN Types ON Users.type = Types.id GROUP BY name";

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
                summary_table = '';
                selection_table = '';
                for (i=0;i< rows.length;i++){
                    selection_table = selection_table + ' <option value=' + rows[i].name + '>';
                    selection_table = selection_table  + rows[i].name.replace('"','').replace('"','') + '</option>';
                    summary_table = summary_table + '<tr><td>' + rows[i].name.replace('"','').replace('"','') + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].deaths_direct + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].deaths_indirect + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].damage_property + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].damage_crops + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].injuries_direct + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].injuries_indirect + '</td></tr>';
                }
               
              
                let response = template.replace('%%SelectionOptions%%',selection_table);
                response = response.replace('%%heading%%',heading);
                response = response.replace('%%Weather_table%%',summary_table);
                response = response.replace('%%next%%',nextbutton);
                response = response.replace('%%previous%%',prevbutton);
                res.status(200).type('html').send(response); 
            });    
    });
});
heading = '';
response = '';
summaryquery = '';

//get request for a specific grouping
app.get('/:selected_template/:selected_grouping/', (req, res) => {
    fs.readFile(path.join(template_dir,req.params.selected_template +'.html'), 'utf-8', (err, template) => {

    if(req.params.selected_template = "weather"){
        selectionquery = "SELECT name FROM Types";
        summaryquery = "SELECT cz_name,name,SUM(deaths_direct) AS deaths_direct , SUM(deaths_indirect) AS deaths_indirect\
             ,SUM(damage_property ) AS damage_property,SUM(damage_crops) AS damage_crops, SUM(injuries_direct) AS injuries_direct\
             , SUM(injuries_indirect) as injuries_indirect,  strftime('%Y',date_time) as Year, strftime('%M', date_time)\
              FROM Users LEFT JOIN Types ON Users.type = Types.id GROUP BY name,strftime('%Y',date_time),strftime('%M', date_time)\
              , cz_name ";
        tablequery= '';
        heading = req.params.selected_grouping.replace('_',' ');
        nextbutton = "/weather/";
        prevbutton = "/weather/";
          
   };
  
       db.all(selectionquery,(err, rows) =>{
            selection_table = '';
            summary_table = '';
           let i;
           for (i=0;i< rows.length;i++){
                selection_table = selection_table + ' <option value=' + rows[i].name + '>';
                selection_table = selection_table  + rows[i].name.replace('"','').replace('"','') + '</option>';
        };
           
           
           let response = template.replace('%%SelectionOptions%%',selection_table);
           response = response.replace('%%Weather_table%%',summary_table);
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
