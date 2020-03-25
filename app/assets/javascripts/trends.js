$(document).on('turbolinks:load', function() {
  if (!checkController('trends')) {
    return;
  }

  if (checkController('new') || checkController('edit')) {
    // species autocomplete
    runSelect2('trend_species_id');
    $('#trend_species_id').on('select2:select', function (e) {
      var data = e.params.data;
      Rails.ajax({
        url: "/species/" + data.id + '.js',
        type: "get"
      })
    });
    // let selected_id = $("#trend_species_id option").val();
    // let selected_text = $("#trend_species_id option").text();
    // $("#trend_species_id").select2('data', { id: selected_id, text: selected_text });

    // references autocomplete
    runSelect2('trend_reference_id');
    $('#trend_reference_id').on('select2:select', function (e) {
      var data = e.params.data;
      Rails.ajax({
        url: "/references/" + data.id + '.js',
        type: "get"
      })
    });

    // unit / standard autocomplete

    let select2Elements = [
      'trend_standard_id', 'trend_sampling_method_id',
      'trend_data_type_id', 'trend_ocean_id', 'trend_location_id'
    ];
    select2Elements.forEach(function(element) {
      $('#' + element).select2({ selectOnClose: true });
    });

    function previewFile() {
      var preview = document.querySelector('#img_prev');
      var file    = document.querySelector('#trend_figure').files[0];
      var reader  = new FileReader();

      reader.addEventListener("load", function () {
        preview.src = reader.result;
      }, false);

      if (file) {
        reader.readAsDataURL(file);
      }
    }

    $('#trend_figure').on('change', function(e) {
      previewFile();

      let image = document.getElementById('img_prev');
      image.classList.remove("is-hidden");
    });

    function renderChart() {
      var trendData = document.querySelectorAll('#trend-data input:not([type=hidden]):not([type=checkbox])')

      var years = [];
      var values = [];
      for (i = 0; i < trendData.length; i++) {
        if (i % 2 === 0) {
          years.push(new Date(trendData[i].value));
        } else {
          let val = trendData[i].value;
          values.push(val === "" ? null : val);
        }
      }

      var ctx = document.getElementById('trend-chart').getContext('2d');

      // uncomment this to interpolate between missing data points
      // Chart.defaults.line.spanGaps = true;

      const colours = values.map((value) => value < 0 ? 'red' : 'yellow');
      const pointRadius = values.map((value) => value < 0 ? '6' : '3');
      const pointStyles = values.map((value) => value < 0 ? 'rectRot' : 'circle');
      const pointBorders = values.map((value) => value < 0 ? 'black' : '#f09154');

      const data = {
        labels: years,
        datasets: [{
          fill: false,
          data: values,
          borderColor: '#fe8b36',
          backgroundColor: '#fe8b36',
          lineTension: 0,
          pointRadius: pointRadius,
          pointHoverRadius: 8,
          pointBorderColor: pointBorders,
          pointBackgroundColor: colours,
          pointStyle: pointStyles,
        }]
      }
      const options = {
        type: 'line',
        data: data,
        options: {
          fill: false,
          responsive: true,
          tooltips: {
            callbacks: {
              title: function(tooltipItem, data) {
                return new Date(tooltipItem[0].label).getFullYear() + 1;
              }
            }
          },
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: 'time',
              display: true,
              scaleLabel: {
                display: true,
              },
              distribution: 'series',
              time: {
                unit: 'year'
              }
            }],
            yAxes: [{
              ticks: {
                beginAtZero: true,
              },
              display: true,
              scaleLabel: {
                display: true,
              }
            }]
          }
        }
      }
      const chart = new Chart(ctx, options);
    }

    renderChart();

    if (checkController('edit')) {
      setupYearEventListeners();
      let chart = document.getElementById('trend-chart');
      chart.classList.remove("is-hidden");
    }

    function calcNumYears() {
      let start = document.getElementById('trend_start_year').value;
      let end = document.getElementById('trend_end_year').value;

      if (start.match(/^\d{4}$/) && end.match(/^\d{4}$/)) {
        let noYears = end - start + 1;
        document.getElementById('trend_no_years').value = noYears;
        adjustYearValueInputs(start, end, noYears);

        let help = document.getElementById('trend-help-msg');
        if (help) {
          help.remove();
        }

        let chart = document.getElementById('trend-chart');
        chart.classList.remove("is-hidden");
      }
    }

    // creates or removes year <> value inputs
    function adjustYearValueInputs(start, end, noYears) {
      var trendData = document.getElementById('trend-data');
      trendData.innerHTML = "";

      for (let i = 0; i < noYears; i++) {
        trendData.insertAdjacentHTML('beforeend', yearValueInput(i, parseInt(start) + i));
      }

      setupYearEventListeners();

      let target = document.querySelector('#trend_trend_observations_attributes_0_value');
      target.addEventListener('paste', (event) => {
        let paste = (event.clipboardData || window.clipboardData).getData('text');

        var values = paste.split(/\s|;|,/);
        console.log(values);

        $(values).each(function(index) {
          var inputBox = $("#trend_trend_observations_attributes_" + index + "_value");
          inputBox.val(values[index])
        });

        event.preventDefault();

        renderChart();
      });
    }

    function setupYearEventListeners() {
      var valueInputs = document.querySelectorAll('input.trend-value');
      for (i = 0; i < valueInputs.length; i++) {
        valueInputs[i].addEventListener('change', renderChart);
      }

    }

    function yearValueInput(index, year) {
      return `
    <div class="field is-horizontal">
      <div class="field-body">
          <div class="field">
            <div class="control">
              <input value="${year}" class="input" readonly="readonly" tabindex="-1" type="text" name="trend[trend_observations_attributes][${index}][year]" id="trend_trend_observations_attributes_${index}_year"><br>
            </div>
          </div>

          <div class="field">
            <div class="control">
              <input type="number" step="any" class="input trend-value" name="trend[trend_observations_attributes][${index}][value]" id="trend_trend_observations_attributes_${index}_value"><br>
            </div>
          </div>
      </div>
    </div>
      `
    }

    document.getElementById('trend_end_year')
      .addEventListener('change', calcNumYears);
    document.getElementById('trend_start_year')
      .addEventListener('change', calcNumYears);
  } else if (checkController('show')) {
    $('.tabs ul li').on('click', function() {
      var number = $(this).data('option');
      $('.tabs ul li').removeClass('is-active');
      $(this).addClass('is-active');
      $('.tab-container .tab-item').removeClass('is-active');
      $('div[data-item="' + number + '"]').addClass('is-active');
    });
  }
});
