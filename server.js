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
//group for grouping example years, county, type of weather system, feel free to change the selection query we can figure out what works best
app.get('/:selected_template', (req, res) => {
    console.log(req.params.selected_template);
    console.log(req.query);
    fs.readFile(path.join(template_dir,req.params.selected_template +'.html'), 'utf-8', (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        selectionquery = "COUNT(date_time) as StormsPerYear,SUM(deaths_direct) AS deaths_direct , SUM(deaths_indirect) AS deaths_indirect\
        ,SUM(damage_property ) AS damage_property,SUM(damage_crops) AS damage_crops, SUM(injuries_direct) AS injuries_direct\
        , SUM(injuries_indirect) as injuries_indirect FROM Users LEFT JOIN Types ON Users.type = Types.id ";
        



        // I think we are doing this wrong bc we should query all the data and filter out what we need not select by rows 
        //setting up weather page
        if(req.params.selected_template == "weather"){
             let doublequotes = '"';
             let singlequotes = "'";
             selectionquery = "SELECT name,strftime('%Y',date_time) as Year," + selectionquery 
             //looking for grouping
             if(req.query.hasOwnProperty('group')){
                heading = req.query.group.toUpperCase().replace('_','  ');
                selectionquery = selectionquery  + 'WHERE name ='+ singlequotes+' '+ doublequotes + req.query.group.replace('_',' ')+ doublequotes+ singlequotes;

             }else{
                heading = "Types of Weather Systems";
             };
             if(req.query.group = 'Hail'){
                prevbutton = '/weather?group=Tornado';
                nextbutton = '/weather?group=Thunderstorm_Wind';
            }else if (req.query.group = 'Tornado'){
                prevbutton = '/weather?group=Thunderstorm_Wind';
                nextbutton = '/weather?group=Hail';
            }else{
                prevbutton = '/weather?group=Tornado';
                nextbutton = '/weather?group=Hail';
                
            };
             
             selectionquery = selectionquery + " GROUP By strftime('%Y',date_time),name";
             console.log(selectionquery);
             
             
        }
        else if(req.params.selected_template == "year"){
            selectionquery = "cz_name as name, deaths_direct, deaths_indirect, damage_property, damage_crops, injuries_direct, injuries_indirect FROM Users ";
            let doublequotes = '"';
            let singlequotes = "'";
            selectionquery = "SELECT " + selectionquery 
            //looking for grouping
            if(req.query.hasOwnProperty('group')){
               heading = req.query.group.toUpperCase().replace('_','  ');
               selectionquery = selectionquery  + 'WHERE name ='+ singlequotes+' '+ doublequotes + req.query.group.replace('_',' ')+ doublequotes+ singlequotes;

            }else{
               heading = "County";
            };
            
            
            selectionquery = selectionquery + " GROUP By cz_name";
            console.log(selectionquery); //<--- all this stuff is a place holder so the website will not crash 
        }
        else if(req.params.selected_template == "county"){
        selectionquery = "cz_name as name, deaths_direct, deaths_indirect, damage_property, damage_crops, injuries_direct, injuries_indirect FROM Users ";
            let doublequotes = '"';
            let singlequotes = "'";
            selectionquery = "SELECT " + selectionquery 
            //looking for grouping
            if(req.query.hasOwnProperty('group')){
               heading = req.query.group.toUpperCase().replace('_','  ');
               selectionquery = selectionquery  + 'WHERE name ='+ singlequotes+' '+ doublequotes + req.query.group.replace('_',' ')+ doublequotes+ singlequotes;

            }else{
               heading = "County";
            };
            
            
            selectionquery = selectionquery + " GROUP By cz_name";
            console.log(selectionquery);
        };
            db.all(selectionquery,(err, rows)=>{
                console.log(err);
                let i;
                summary_table = '';
                selection_table = '';
               
                for (i=0;i< rows.length;i++){
                    selection_table = selection_table + ' <option value=' + rows[i].name + '>';
                    selection_table = selection_table  + rows[i].name.replace('"','').replace('"','') + '</option>';
                    summary_table = summary_table + '<tr><td>' + rows[i].name.replace('"','').replace('"','') + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].Year+ '</td>';
                    summary_table = summary_table + '<td>' + rows[i].StormsPerYear+ '</td>';
                    summary_table = summary_table + '<td>' + rows[i].deaths_direct + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].deaths_indirect + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].damage_property + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].damage_crops + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].injuries_direct + '</td>';
                    summary_table = summary_table + '<td>' + rows[i].injuries_indirect + '</td></tr>';
                   };
               

               
              
                let response = template.replace('%%heading%%',heading);
                if(!req.params.selected_template == 'weather'){
                    response = response.replace('%%SelectionOptions%%',selection_table);
                };
                response = response.replace('%%Weather_table%%',summary_table);
                response = response.replace('%%next%%',nextbutton);
                response = response.replace('%%previous%%',prevbutton);
                res.status(200).type('html').send(response); 
            });    
    });
});





app.listen(port, () => {
    console.log('Now listening on port ' + port);
});