/**
 * Nong Muang Hospital Analytics Web Application - Charts Manager
 * Data Dashboard กลุ่มงานการพยาบาล - KPIMaster
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
      grid: { color: '#f1f5f9' },
      ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748b' }
    },
    y: {
      grid: { display: false },
      ticks: { font: { family: 'Sarabun', size: 12 }, color: '#334155' }
    }
  }
};

/**
 * Render/Update Dashboard Charts based on active Tab
 */
function updateDashboardCharts(activeTab = 'tab-overview') {
  if (activeTab === 'tab-overview') {
    renderOverviewCharts();
  } else if (activeTab === 'tab-ipd') {
    renderQualitySafetyCharts();
  } else if (activeTab === 'tab-referral') {
    renderSatisfactionCommunityCharts();
  }
}

/**
 * Tab 1: KPIMaster Overview Charts
 */
function renderOverviewCharts() {
  const metrics = activeDataset.metrics;
  const years = activeDataset.yearLabels;

  // Chart 1.1: Horizontal Bar Chart showing KPI Performance & Status (Green/Yellow/Red)
  const ctx1 = document.getElementById('chartOverviewMain');
  if (ctx1) {
    if (chartInstances.overviewMain) chartInstances.overviewMain.destroy();

    // Full names for Y-axis without cutting off text
    const fullLabels = [
      "1. Door to EKG < 10 นาที",
      "2. สมรรถนะดูแลผู้ป่วยโรคสำคัญ",
      "3. บันทึกกระบวนการพยาบาล",
      "4. แผลกดทับรายใหม่",
      "5. ติดเชื้อ CA-UTI",
      "6. การเยี่ยมบ้านตามเกณฑ์",
      "7. ความพึงพอใจ OPD",
      "8. ความพึงพอใจ IPD",
      "9. ความพึงพอใจ ชุมชน"
    ];

    // % Achievement of Target (% บรรลุเป้าหมาย) to put all 9 KPIs on a unified 0-100% scale
    const achievementPcts = metrics.map(m => {
      const val = m.values[2];
      const target = m.targetVal;
      const op = m.targetOperator;

      if (op === '<=' || op === '<') {
        if (val <= target) return 100;
        return Math.max(0, Math.round((target / val) * 100));
      } else {
        return Math.min(120, Math.round((val / target) * 100));
      }
    });

    // Color bars dynamically based on status: Pass (Emerald), Caution (Amber), Fail (Rose)
    const barColors = metrics.map(m => {
      const evalRes = evaluateKpiTarget(m, m.values[2]);
      if (evalRes.status === 'pass') return '#10b981';    // Emerald Green
      if (evalRes.status === 'caution') return '#f59e0b'; // Amber Yellow
      return '#f43f5e';                                   // Rose Red
    });

    chartInstances.overviewMain = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: fullLabels,
        datasets: [
          {
            label: '% อัตราการบรรลุเป้าหมาย (% Achievement)',
            data: achievementPcts,
            backgroundColor: barColors,
            borderRadius: 6,
            barThickness: 18
          }
        ]
      },
      options: {
        indexAxis: 'y', // Horizontal Bar Chart for maximum readability
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Status colors self-explain via tooltips & badges
          },
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              title: (ctx) => metrics[ctx[0].dataIndex].name,
              label: (ctx) => {
                const metric = metrics[ctx.dataIndex];
                const val = metric.values[2];
                const evalRes = evaluateKpiTarget(metric, val);
                return [
                  ` ผลงานปี 2569: ${val} ${metric.unit}`,
                  ` เกณฑ์เป้าหมาย: ${metric.target}`,
                  ` อัตราบรรลุเป้าหมาย: ${ctx.raw}%`,
                  ` สถานะ: ${evalRes.label}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#f1f5f9' },
            min: 0,
            max: 120,
            ticks: {
              font: { family: 'Sarabun', size: 11 },
              callback: (val) => val === 100 ? '100% (เป้าหมาย)' : `${val}%`
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { family: 'Sarabun', size: 11, weight: '600' },
              color: '#1e293b'
            }
          }
        }
      }
    });
  }

  // Chart 1.2: ความพึงพอใจ 3 ด้าน ย้อนหลัง 3 ปี
  const ctx2 = document.getElementById('chartOverviewDaily');
  if (ctx2) {
    if (chartInstances.overviewDaily) chartInstances.overviewDaily.destroy();

    const opdSat = getMetric("opd_satisfaction").values;
    const ipdSat = getMetric("ipd_satisfaction").values;
    const commSat = getMetric("community_satisfaction").values;

    chartInstances.overviewDaily = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'ผู้ป่วยใน (IPD)',
            data: ipdSat,
            borderColor: '#0d9488', // Teal
            backgroundColor: 'rgba(13, 148, 136, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            fill: false,
            pointRadius: 6
          },
          {
            label: 'ประชาชนในชุมชน',
            data: commSat,
            borderColor: '#10b981', // Emerald
            backgroundColor: 'transparent',
            borderWidth: 3,
            tension: 0.3,
            fill: false,
            pointRadius: 6
          },
          {
            label: 'ผู้ป่วยนอก (OPD)',
            data: opdSat,
            borderColor: '#6366f1', // Indigo
            backgroundColor: 'transparent',
            borderWidth: 3,
            tension: 0.3,
            fill: false,
            pointRadius: 6
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748b' } },
          y: {
            grid: { color: '#f1f5f9' },
            min: 75,
            max: 100,
            ticks: { font: { family: 'Sarabun', size: 12 }, callback: (v) => `${v}%` }
          }
        },
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(2)}%`
            }
          }
        }
      }
    });
  }
}

/**
 * Tab 2: Quality & Patient Safety Charts
 */
function renderQualitySafetyCharts() {
  const years = activeDataset.yearLabels;

  const doorEkg = getMetric("door_to_ekg").values;
  const compEval = getMetric("competency_eval").values;
  const recordScore = getMetric("nursing_record_score").values;

  const ulcer = getMetric("pressure_ulcer_rate").values;
  const cauti = getMetric("cauti_rate").values;

  // Chart 2.1: คุณภาพสมรรถนะและการบันทึกการพยาบาล
  const ctx1 = document.getElementById('chartIpdOccupancy');
  if (ctx1) {
    if (chartInstances.ipdOccupancy) chartInstances.ipdOccupancy.destroy();

    chartInstances.ipdOccupancy = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: 'ประเมินสมรรถนะดูแลโรคสำคัญ (%)',
            data: compEval,
            backgroundColor: '#0d9488',
            borderRadius: 6
          },
          {
            label: 'บันทึกกระบวนการพยาบาล (%)',
            data: recordScore,
            backgroundColor: '#6366f1',
            borderRadius: 6
          },
          {
            label: 'Door to EKG < 10 นาที (%)',
            data: doorEkg,
            backgroundColor: '#f59e0b',
            borderRadius: 6
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748b' } },
          y: {
            grid: { color: '#f1f5f9' },
            min: 40,
            max: 100,
            ticks: { font: { family: 'Sarabun', size: 12 }, callback: (v) => `${v}%` }
          }
        },
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%`
            }
          }
        }
      }
    });
  }

  // Chart 2.2: อัตราความปลอดภัยผู้ป่วย (แผลกดทับ & CA-UTI)
  const ctx2 = document.getElementById('chartHomeWardGrowth');
  if (ctx2) {
    if (chartInstances.homeWardGrowth) chartInstances.homeWardGrowth.destroy();

    chartInstances.homeWardGrowth = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: 'แผลกดทับรายใหม่ (ต่อ 1,000 วันนอน)',
            data: ulcer,
            backgroundColor: '#f43f5e', // Rose
            borderRadius: 6
          },
          {
            label: 'ติดเชื้อ CA-UTI (ต่อ 1,000 วันคาสาย)',
            data: cauti,
            backgroundColor: '#f59e0b', // Amber
            borderRadius: 6
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748b' } },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Sarabun', size: 12 }, callback: (v) => `${v}` }
          }
        },
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`
            }
          }
        }
      }
    });
  }
}

/**
 * Tab 3: Satisfaction & Community Nursing Charts
 */
function renderSatisfactionCommunityCharts() {
  const years = activeDataset.yearLabels;

  const opdSat = getMetric("opd_satisfaction").values;
  const ipdSat = getMetric("ipd_satisfaction").values;
  const commSat = getMetric("community_satisfaction").values;
  const homeVisit = getMetric("home_visit_rate").values;

  // Chart 3.1: สถิติความพึงพอใจ 3 กลุ่มผู้รับบริการ
  const ctx1 = document.getElementById('chartReferral');
  if (ctx1) {
    if (chartInstances.referral) chartInstances.referral.destroy();

    chartInstances.referral = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          {
            label: 'ความพึงพอใจผู้ป่วยใน (IPD)',
            data: ipdSat,
            backgroundColor: '#0d9488',
            borderRadius: 6
          },
          {
            label: 'ความพึงพอใจประชาชนในชุมชน',
            data: commSat,
            backgroundColor: '#10b981',
            borderRadius: 6
          },
          {
            label: 'ความพึงพอใจผู้ป่วยนอก (OPD)',
            data: opdSat,
            backgroundColor: '#6366f1',
            borderRadius: 6
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748b' } },
          y: {
            grid: { color: '#f1f5f9' },
            min: 75,
            max: 100,
            ticks: { font: { family: 'Sarabun', size: 12 }, callback: (v) => `${v}%` }
          }
        },
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(2)}%`
            }
          }
        }
      }
    });
  }

  // Chart 3.2: อัตราการได้รับการเยี่ยมบ้านตามเกณฑ์ (Home Visit Rate)
  const ctx2 = document.getElementById('chartMortality');
  if (ctx2) {
    if (chartInstances.mortality) chartInstances.mortality.destroy();

    chartInstances.mortality = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'อัตราการเยี่ยมบ้านตามเกณฑ์ (%)',
            data: homeVisit,
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointRadius: 6
          }
        ]
      },
      options: {
        ...COMMON_OPTIONS,
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 12 }, color: '#64748b' } },
          y: {
            grid: { color: '#f1f5f9' },
            min: 50,
            max: 100,
            ticks: { font: { family: 'Sarabun', size: 12 }, callback: (v) => `${v}%` }
          }
        },
        plugins: {
          ...COMMON_OPTIONS.plugins,
          tooltip: {
            ...COMMON_OPTIONS.plugins.tooltip,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}% (เป้าหมาย > 80%)`
            }
          }
        }
      }
    });
  }
}
