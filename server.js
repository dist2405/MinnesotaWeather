
// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
const Chart = require('chart.js');

function toPascal(string) {
    return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
}

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

//group for grouping example years, county, type of weather system, feel free to change the selection query we can figure out what works best
app.get('/:selected_template', (req, res) => {
    fs.readFile(path.join(template_dir, req.params.selected_template + '.html'), 'utf-8', (err, template) => {
        if (err) {
            console.log(err);
            res.status(404).type('json').send({ error: 404, message: `There's no data for ${req.params.selected_template} route you silly goose.` });
            return;
        }
        // modify `template` and send response
        // this will require a query to the SQL database
        let query = '';
        let heading = '';
        let selections = '';
        let nextbutton = '';
        let prevbutton = '';

        switch (req.params.selected_template) {
            case 'weather':
                query = 'SELECT name as weather, COUNT(date_time) as num_of_storms, strftime(\'%Y\', date_time) as year, SUM(deaths_direct) as direct_deaths, SUM(injuries_direct) as direct_injuries, SUM(damage_property) as property_damage, SUM(damage_crops) as crops_damaged FROM Users LEFT JOIN Types ON Users.type = Types.id ';
                if(req.query['group']) {
                    heading = req.query.group.toUpperCase().replace('_','  ');
                } else {
                    heading = "Types of Weather Systems";
                }
                query = query + " GROUP By strftime('%Y',date_time),name";
                break;
            case 'year':
                query = 'SELECT strftime(\'%Y\', date_time) as year, Types.name as type, COUNT(date_time) as num_of_storms, SUM(deaths_direct) as direct_deaths, SUM(injuries_direct) as direct_injuries, SUM(damage_property) as property_damage, SUM(damage_crops) as crops_damaged FROM Users LEFT JOIN Types ON Users.type = Types.id ';


                if (req.query['group']) {
                    heading = req.query.group.toUpperCase().replace('_', '  ');
                } else {
                    heading = 'Year';
                }
                query = query + 'GROUP BY strftime(\'%Y\', date_time), Types.name';
                break;
            case 'county':
                query = 'SELECT replace(cz_name, \' CO.\', \'\') as county, Types.name as type, COUNT(date_time) as num_of_storms, SUM(deaths_direct) as direct_deaths, SUM(injuries_direct) as direct_injuries, SUM(damage_property) as property_damage, SUM(damage_crops) as crops_damaged FROM Users LEFT JOIN Types ON Users.type = Types.id ';

                if (req.query['group']) {
                    heading = req.query.group.toUpperCase().replace('_', '  ');
                } else {
                    heading = 'County';
                }
                query = query + 'GROUP BY replace(cz_name, \' CO.\', \'\') , Types.name';
                break;
        }

        db.all(query, (err, rows) => {
            if (err || rows.length == 0) {
                console.log(err);
                res.status(404).type('json').send({ error: 404, message: `There's no data for ${req.params.selected_template} you silly goose.` });
                return;
            }


            


            let table_head = '';
            let table_body = '';

            if (req.query['group']) {
                let value = req.query.group.split('_').map(toPascal).join(' ').trim();
                heading = value;
            } else {
                heading = toPascal(req.params.selected_template);
            }

            const selection = [];




            // create array of choices
            for (const row of rows) {
                if (row[req.params.selected_template]) {
                    var value = row[req.params.selected_template].replace('"', '').replace('"', '').split(' ').map(toPascal).join(' ').trim();
                    if (!selection.includes(value)) selection.push(value);
                }
            }

            selection.sort();

            // setup table headers
            for (const property in rows[0]) {
                table_head += '<th';
                if (property == req.params.selected_template) table_head += ' class="name"';
                table_head += `>${property.split('_').map(toPascal).join(' ').trim()}</th>`;
            }

            // setup next/previous buttons
            if (!(req.query['group'])) {
                prevbutton = `/${req.params.selected_template}?group=${selection[selection.length - 1]}`;
                nextbutton = `/${req.params.selected_template}?group=${selection[0]}`;
            } else {
                let row = selection.indexOf(heading.split(' ').map(toPascal).join(' ').replace('"', '').replace('"', '').trim());

                if (row == 0) {
                    prevbutton = `/${req.params.selected_template}?group=${selection[selection.length - 1]}`;
                    nextbutton = `/${req.params.selected_template}?group=${selection[1]}`;
                } else if (row == selection.length - 1) {
                    prevbutton = `/${req.params.selected_template}?group=${selection[row - 1]}`;
                    nextbutton = `/${req.params.selected_template}?group=${selection[0]}`;
                } else {
                    prevbutton = `/${req.params.selected_template}?group=${selection[row - 1]}`;
                    nextbutton = `/${req.params.selected_template}?group=${selection[row + 1]}`;
                }
            }

            if (req.query['group']) {
                if (req.params.selected_template == 'weather') {
                    rows = rows.filter(r => r[req.params.selected_template] == ` "${req.query.group.split('_').join(' ')}"`);
                } else {
                    rows = rows.filter(r => r[req.params.selected_template] == req.query.group.split('_').join(' ').toUpperCase());
                }

                if (rows.length == 0) {
                    // the filtered we applied resulted in no rows, so we should send 404
                    res.status(404).type('json').send({ error: 404, message: `There's no data for ${req.params.selected_template} ${req.query['group']} you silly goose.` });
                    return;
                }
            }
            const dataArray = [];
            // iterate over rows
            for (const row of rows) {
                // start a row
                table_body += '<tr>';
                var arr = []
                // iterate over the properties of the row object
                for (const property in row) {
                    var value = typeof row[property] == 'string' ? row[property].replace('"', '').replace('"', '').split(' ').map(toPascal).join(' ').trim() : row[property];
                    table_body += `<td>${value}</td>`;
                    arr.push(value);
                }
                //end our row
                dataArray.push(arr);
                table_body += '</tr>';
            }



            var col1 = [];
            var col2 = [];
            for(let i = 0; i < dataArray.length; i++){
                col1.push(dataArray[i][1]);
                col2.push(dataArray[i][2]);
            }


            // setup choice/grouping dropdown
            let select = false;

            for (let i = 0; i < selection.length; i++) {
                selections += `<option value="${selection[i].replace('"', '').replace('"', '').split(' ').map(toPascal).join(' ').trim()}" `
                if (selection[i].toUpperCase() == heading) {
                    select = true;
                    selections += "selected"
                }
                selections += `>${selection[i].replace('"', '').replace('"', '').split(' ').map(toPascal).join(' ').trim()}</option>`;
            }

            if (!select) {
                selections = `"<option value="All" selected>All</option>` + selections;
            } else {
                selections = `"<option value="All">All</option>` + selections;
            }

            var arr = [];
            var labels = [];
            var title = "";


            var chartInfo = "NO";
            if(heading != "County" && heading != "Weather" && heading != "Year"){
                if(heading == "Thunderstorm Wind" || heading == "Tornado" || heading == "Hail") {
                    arr = col1;
                    labels = col2;
                    title = heading + " Count Per Year";
                }
                else if(parseInt(heading) != NaN) {
                    arr = col2;
                    labels = col1;
                    title = heading + " Count Per Weather Type";
                }
                else {
                    arr = col2;
                    labels = col1;
                    title = heading + " Count Per Weather Type";
                }

                chartInfo = {
                    type: heading,
                    title: title,
                    data: arr,
                    labels: labels
                };

                chartInfo = JSON.stringify(chartInfo);
            }

            // bake our data into response and send it
            const response = template.replace('%%heading%%', heading)
                .replace('%%Choices%%', selections)
                .replace(/%%next%%/g, nextbutton)
                .replace(/%%previous%%/g, prevbutton)
                .replace('%%table_head%%', table_head)
                .replace('%%table_body%%', table_body)
                .replace('%%data%%', chartInfo);

            res.status(200).type('html').send(response);
        });
    });
});

// catch all routes that are not the ones we specified above
app.get('*', function (req, res) {
    res.status(404).type('json').send({ error: 404, message: `There was nothing found at ${req.url} you silly goose.`});
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});