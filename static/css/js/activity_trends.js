document.addEventListener('DOMContentLoaded', function () {
    const chartConfig = (ctx, title, data) => {
      return new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Screen Time', 'Reading', 'Creative Activities'],
          datasets: [{
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',   // screen
              'rgba(54, 162, 235, 0.7)',   // reading
              'rgba(255, 206, 86, 0.7)'    // creative
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: title,
              font: { size: 16 }
            },
            tooltip: {
              callbacks: {
                label: context => `${context.label}: ${context.parsed}%`
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 12 }
              }
            }
          }
        }
      });
    };
  
    chartConfig(
      document.getElementById('vicPie2017'),
      'VIC - 2017–2018',
      [35, 40, 25] // Replace with real data from DB
    );
  
    chartConfig(
      document.getElementById('vicPie2021'),
      'VIC - 2021–2022',
      [50, 30, 20] // Replace with real data from DB
    );
  });
  