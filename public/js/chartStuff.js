window.onload=function() {
    //makeChart();
    var chartJson = document.getElementById("data").innerHTML;
    if(chartJson != "NO") {
        chartJson = JSON.parse(chartJson);
        makeBarChart(chartJson.labels, chartJson.data, chartJson.title, "myChart");
    }
}

function makeBarChart(labels, array, title, element) {
    
    document.getElementById("forChart").innerHTML = '<canvas id="'+ element + '"></canvas>';

    const data = {
        labels: labels,
        datasets: [{
            label: title,
            backgroundColor: [
                'rgba(255, 99, 132, .75)',
                'rgba(54, 162, 235, .75)',
                'rgba(255, 206, 86, .75)',
                'rgba(75, 192, 192, .75)',
                'rgba(153, 102, 255, .75)',
                'rgba(255, 159, 64, .75)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            data: array
        }]
    }

    const config = {
        type: 'bar',
        data: data,
        options: {}
    };

    const myChart = new Chart(
        document.getElementById(element),
        config
    );

}






function makeChart() {



    const labels = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
    ];

    const data = {
        labels: labels,
        datasets: [{
        label: 'My First dataset',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: [0, 10, 5, 2, 20, 30, 45],
        }]
    };

    const config = {
        type: 'line',
        data: data,
        options: {}
    };



    const myChart = new Chart(
        document.getElementById('myChart'),
        config
    );

    console.log("loaded");
}