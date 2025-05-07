document.addEventListener('DOMContentLoaded', function () {
  fetch('/api/scam_internet_by_location')
    .then(response => response.json())
    .then(data => {
      const locations = [...new Set(data.map(item => item.location_name))];
      const modes = [...new Set(data.map(item => item.Scam_Contact_Mode))];

      const datasets = modes.map(mode => {
        return {
          label: mode,
          data: locations.map(loc => {
            const match = data.find(
              d => d.location_name === loc && d.Scam_Contact_Mode === mode
            );
            return match ? match.total_reports : 0;
          }),
          borderWidth: 1
        };
      });

      const ctx = document.getElementById('scamChart');
      if (ctx) {
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: locations,
            datasets: datasets
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Internet-Related Scam Reports by Location'
              }
            },
            scales: {
              x: { stacked: false },
              y: { beginAtZero: true }
            }
          }
        });
      } else {
        console.error("Chart canvas not found!");
      }
    })
    .catch(err => {
      console.error("Error fetching scam data:", err);
    });
});
