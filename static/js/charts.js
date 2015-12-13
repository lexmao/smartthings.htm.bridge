$(function() {

    var $chartContainer = $('#chart-container');
    var charts = [];
    var minDate, maxDate;

    function updateMinMaxDates(chart) {
        var extremes = chart.xAxisExtremes();
        var min = extremes.shift();
        var max = extremes.shift();
        if (! minDate || min < minDate) {
            minDate = min;
        }
        if (! maxDate || max > maxDate) {
            maxDate = max;
        }
    }

    function removeStringData(data) {
        var stringColumns = ['component', 'timezone'];
        var doomedIndexes = [];
        var series = data.series[0];
        _.each(series.columns, function(name, index) {
            if (_.contains(stringColumns, name)) {
                doomedIndexes.push(index);
            }
        });
        // Now that we know which indexes are doomed, we reverse the order so we
        // can extract them from the list from the end
        doomedIndexes = doomedIndexes.reverse();
        _.each(doomedIndexes, function(doomed) {
            series.columns.splice(doomed, 1);
        });
        _.each(series.values, function(row) {
            _.each(doomedIndexes, function(doomed) {
                row.splice(doomed, 1);
            });
        });
    }

    function convertJsonDataToCsv(data) {
        var rows = [];
        var series = data.series[0];

        var headers = series.columns;
        var values = series.values;
        
        rows.push(headers);
        
        _.each(values, function(values) {
            rows.push(values.join(','));
        });
        
        return rows.join('\n');
    }

    function renderChart(id, data) {
        var el = document.getElementById(id);
        removeStringData(data);
        var csvString = convertJsonDataToCsv(data);
        var width = $('#' + id + '-container').width()
        return new Dygraph(el, csvString, {
            width: width,
            height: 400,
            series: {
              value: {
                strokeWidth: 2,
                strokePattern: [4, 1]
              },
              anomalyScore: {
                axis: 'y2',
                color: 'orange'
              },
              anomalyLikelihood: {
                axis: 'y2',
                color: 'red'
              }
            },
            axes: {
              y2: {
                valueRange: [0, 1.1]
              }
            },
            legend: 'follow',
            labelsSeparateLines: true
        });
    }

    function renderSensorChart(name, data) {
        console.log(name);
        var id = name.replace('/', '_').replace(/\+/g, '-');
        return renderChart(id, data);
    }


    $.getJSON('/_data/sensors', function(sensors) {
        _.each(sensors, function(sensorName) {
            $.getJSON('/_data/sensor/' + sensorName, function(sensorData) {
                var chart = renderSensorChart(sensorName, sensorData);
                updateMinMaxDates(chart);
                charts.push(chart);
                if (charts.length == sensors.length) {
                    _.each(charts, function(chart) {
                        chart.updateOptions({
                            dateWindow: [minDate, maxDate]
                        });
                    });
                }
            });
        });
    });
});