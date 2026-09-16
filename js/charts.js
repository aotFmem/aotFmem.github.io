/**
 * Nong Muang Hospital Analytics Web Application - Charts Manager
 * Handles Chart.js instances for Overview, IPD & Home Ward, Referral & Mortality tabs
 */

// Global Chart Instances Store
const chartInstances = {};

/**
 * Common Chart Styling Options
 */
const COMMON_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: { family: 'Sarabun', size: 12, weight: '500' },
        usePointStyle: true,
        padding: 16
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleFont: { family: 'Sarabun', size: 13, weight: 'bold' },
      bodyFont: { family: 'Sarabun', size: 12 },
      padding: 10,
      cornerRadius: 8,
      boxPadding: 4
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748b' }
    },
    y: {
      grid: { color: '#f1f5f9' },
      ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748b' }
    }
  }
};

/**
 * Render/Update All Dashboard Charts based on active Tab
 */
function updateDashboardCharts(activeTab = 'tab-overview') {
  if (activeTab === 'tab-overview') {
    renderOverviewCharts();
  } else if (activeTab === 'tab-ipd') {
    renderIpdHomeWardCharts();
  } else if (activeTab === 'tab-referral') {
    renderReferralMortalityCharts();
  }
}

/**
 * Tab 1: Overview Charts
 */
function renderOverviewCharts() {
  const years = activeDataset.yearLabels;
  const opdData = getMetric("opd_patients").values;
  const ncdData = getMetric("ncd_patients").values;
  const erData = getMetric("er_patients").values;

  const opdNcdDaily = getMetric("opd_ncd_daily_avg").values;
  const opdDaily = getMetric("opd_daily_avg").values;
  const ncdDaily = getMetric("ncd_daily_avg").values;
  const erDaily = getMetric("er_daily_avg").values;

  // Chart 1.1: OPD vs NCD vs ER Comparison
  const ctx1 = document.getElementById('chartOverviewMain');
  if (ctx1) {
    if (chartInstances.overviewMain) chartInstances.overviewMain.destroy();
    
    chartInstances.overviewMain = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: 'ผู้ป่วย OPD',
            data: opdData,
            backgroundColor: '#0d9488', // Teal
            borderRadius: 6
          },
          {
            label: 'ผู้ป่วย NCD',
            data: ncdData,
            backgroundColor: '#6366f1', // Indigo
            borderRadius: 6
          },
          {
            label: 'ผู้ป่วย ER',
            data: erData,
            backgroundColor: '#f59e0b', // Amber
            borderRadius: 6
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString()} ราย`
            }
          }
        }
      }
    });
  }

  // Chart 1.2: Daily Average (OPD+NCD, OPD, NCD, ER)
  const ctx2 = document.getElementById('chartOverviewDaily');
  if (ctx2) {
    if (chartInstances.overviewDaily) chartInstances.overviewDaily.destroy();

    chartInstances.overviewDaily = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'OPD + NCD เฉลี่ยต่อวัน',
            data: opdNcdDaily,
            borderColor: '#0d9488', // Teal
            backgroundColor: 'rgba(13, 148, 136, 0.08)',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointStyle: 'circle'
          },
          {
            label: 'OPD เฉลี่ยต่อวัน',
            data: opdDaily,
            borderColor: '#6366f1', // Indigo
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            tension: 0.3,
            fill: false,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointStyle: 'rect'
          },
          {
            label: 'NCD เฉลี่ยต่อวัน',
            data: ncdDaily,
            borderColor: '#10b981', // Emerald
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            tension: 0.3,
            fill: false,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointStyle: 'triangle'
          },
          {
            label: 'ผู้ป่วย ER เฉลี่ยต่อวัน',
            data: erDaily,
            borderColor: '#f59e0b', // Amber
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            tension: 0.3,
            fill: false,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointStyle: 'star'
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} ราย/วัน`
            }
          }
        }
      }
    });
  }
}

/**
 * Tab 2: IPD & Home Ward Charts
 */
function renderIpdHomeWardCharts() {
  const years = activeDataset.yearLabels;
  const ipdPatients = getMetric("ipd_patients").values;
  const occupancyRate = getMetric("ipd_occupancy_rate").values;

  const homeWardPatients = getMetric("homeward_patients").values;
  const homeWardDays = getMetric("homeward_bed_days").values;

  // Chart 2.1: IPD Patients & Bed Occupancy Rate (Dual Axis)
  const ctx1 = document.getElementById('chartIpdOccupancy');
  if (ctx1) {
    if (chartInstances.ipdOccupancy) chartInstances.ipdOccupancy.destroy();

    chartInstances.ipdOccupancy = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            type: 'bar',
            label: 'จำนวนผู้ป่วยใน (IPD)',
            data: ipdPatients,
            backgroundColor: 'rgba(99, 102, 241, 0.85)', // Indigo
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'อัตราครองเตียง IPD (%)',
            data: occupancyRate,
            borderColor: '#f43f5e', // Rose
            backgroundColor: '#f43f5e',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        scales: {
          x: COMMON_OPTIONS.scales.x,
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748b' },
            title: { display: true, text: 'จำนวนผู้ป่วย (ราย)', font: { family: 'Sarabun', size: 11 } }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { font: { family: 'Sarabun', size: 12 }, color: '#f43f5e', callback: (val) => `${val}%` },
            title: { display: true, text: 'อัตราครองเตียง (%)', font: { family: 'Sarabun', size: 11 } }
          }
        },
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.yAxisID === 'y1') {
                  return ` ${ctx.dataset.label}: ${ctx.raw}%`;
                }
                return ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString()} ราย`;
              }
            }
          }
        }
      }
    });
  }

  // Chart 2.2: Home Ward Explosive Growth (2567 - 2569)
  const ctx2 = document.getElementById('chartHomeWardGrowth');
  if (ctx2) {
    if (chartInstances.homeWardGrowth) chartInstances.homeWardGrowth.destroy();

    chartInstances.homeWardGrowth = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            type: 'bar',
            label: 'จำนวนผู้ป่วย Home Ward (ราย)',
            data: homeWardPatients,
            backgroundColor: '#10b981', // Emerald
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'วันนอนสะสม Home Ward (วัน)',
            data: homeWardDays,
            borderColor: '#0d9488', // Teal
            backgroundColor: 'rgba(13, 148, 136, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        scales: {
          x: COMMON_OPTIONS.scales.x,
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748b' },
            title: { display: true, text: 'จำนวนผู้ป่วย (ราย)', font: { family: 'Sarabun', size: 11 } }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { font: { family: 'Sarabun', size: 12 }, color: '#0d9488' },
            title: { display: true, text: 'วันนอนสะสม (วัน)', font: { family: 'Sarabun', size: 11 } }
          }
        },
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => {
                if (ctx.dataset.yAxisID === 'y1') {
                  return ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString()} วัน`;
                }
                return ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString()} ราย`;
              }
            }
          }
        }
      }
    });
  }
}

/**
 * Tab 3: Referral & Mortality Charts
 */
function renderReferralMortalityCharts() {
  const years = activeDataset.yearLabels;
  const referOpd = getMetric("refer_opd").values;
  const referEr = getMetric("refer_er").values;
  const referIpd = getMetric("refer_ipd").values;

  const deathsIpd = getMetric("deaths_ipd").values;
  const deathsEr = getMetric("deaths_er").values;

  // Chart 3.1: Referral Statistics (Refer OPD, Refer ER, Refer IPD)
  const ctx1 = document.getElementById('chartReferral');
  if (ctx1) {
    if (chartInstances.referral) chartInstances.referral.destroy();

    chartInstances.referral = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Refer OPD',
            data: referOpd,
            backgroundColor: '#0d9488',
            borderRadius: 6
          },
          {
            label: 'Refer ER',
            data: referEr,
            backgroundColor: '#f59e0b',
            borderRadius: 6
          },
          {
            label: 'Refer IPD',
            data: referIpd,
            backgroundColor: '#6366f1',
            borderRadius: 6
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString()} ราย`
            }
          }
        }
      }
    });
  }

  // Chart 3.2: Mortality Statistics (IPD vs ER)
  const ctx2 = document.getElementById('chartMortality');
  if (ctx2) {
    if (chartInstances.mortality) chartInstances.mortality.destroy();

    chartInstances.mortality = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: 'จำนวนเสียชีวิต IPD',
            data: deathsIpd,
            backgroundColor: '#f43f5e', // Rose
            borderRadius: 6
          },
          {
            label: 'จำนวนเสียชีวิต ER',
            data: deathsEr,
            backgroundColor: '#e11d48', // Dark Rose
            borderRadius: 6
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} ราย`
            }
          }
        }
      }
    });
  }
}
