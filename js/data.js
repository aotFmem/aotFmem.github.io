/**
 * Nong Muang Hospital Analytics Web Application - Data Manager
 * Dynamic Live Sync with Google Sheets CSV & Embedded Fallback Data
 */

const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1k7SdCXh_46CISwoh6WeAoEVbQHAE6_rScrAXDVcloa4/export?format=csv";

// Embedded 5-Year Historical Dataset (พ.ศ. 2565 - 2569)
const FALLBACK_DATASET = {
  years: ["2565", "2566", "2567", "2568", "2569"],
  yearLabels: ["2565", "2566", "2567", "2568", "2569 (10 เดือน)"],
  categories: {
    opd_ncd: "ผู้ป่วยนอก & OPD/NCD",
    er: "ผู้ป่วยฉุกเฉิน ER",
    ipd: "ผู้ป่วยใน IPD & เตียง",
    home_ward: "บริการ Home Ward",
    referral: "การส่งต่อผู้ป่วย (Refer)",
    mortality: "สถิติการเสียชีวิต"
  },
  metrics: [
    {
      id: "outpatient_all",
      name: "ผู้ป่วยนอกทุกประเภท",
      category: "opd_ncd",
      unit: "ราย",
      type: "volume",
      values: [130823, 90297, 104733, 101604, 83939]
    },
    {
      id: "opd_patients",
      name: "ผู้ป่วย OPD",
      category: "opd_ncd",
      unit: "ราย",
      type: "volume",
      values: [22799, 24758, 25633, 23657, 20181]
    },
    {
      id: "ncd_patients",
      name: "ผู้ป่วย NCD",
      category: "opd_ncd",
      unit: "ราย",
      type: "volume",
      values: [15717, 17206, 17707, 16849, 12981]
    },
    {
      id: "opd_ncd_total",
      name: "รวมผู้ป่วย OPD + NCD",
      category: "opd_ncd",
      unit: "ราย",
      type: "volume",
      values: [38516, 41964, 43340, 40506, 33162]
    },
    {
      id: "opd_ncd_daily_avg",
      name: "OPD + NCD เฉลี่ยต่อวัน",
      category: "opd_ncd",
      unit: "ราย/วัน",
      type: "rate",
      values: [160, 174, 179, 169, 166]
    },
    {
      id: "opd_daily_avg",
      name: "OPD เฉลี่ยต่อวัน",
      category: "opd_ncd",
      unit: "ราย/วัน",
      type: "rate",
      values: [95, 103, 106, 99, 101]
    },
    {
      id: "er_patients",
      name: "ผู้ป่วย ER",
      category: "er",
      unit: "ราย",
      type: "volume",
      values: [20058, 23350, 26457, 24888, 20831]
    },
    {
      id: "er_daily_avg",
      name: "ผู้ป่วย ER เฉลี่ยต่อวัน",
      category: "er",
      unit: "ราย/วัน",
      type: "rate",
      values: [55, 64, 72, 68, 69]
    },
    {
      id: "ipd_patients",
      name: "ผู้ป่วยใน",
      category: "ipd",
      unit: "ราย",
      type: "volume",
      values: [1660, 2316, 2703, 1734, 1562]
    },
    {
      id: "ipd_bed_days",
      name: "วันนอนรวม IPD",
      category: "ipd",
      unit: "วัน",
      type: "volume",
      values: [7000, 7954, 9138, 4212, 4694]
    },
    {
      id: "ipd_lr_bed_days",
      name: "วันนอนรวม IPD+LR",
      category: "ipd",
      unit: "วัน",
      type: "volume",
      values: [7027, 8034, 9154, 4257, 4706]
    },
    {
      id: "ipd_daily_avg",
      name: "ผู้ป่วย IPD เฉลี่ยต่อวัน",
      category: "ipd",
      unit: "ราย/วัน",
      type: "rate",
      values: [19, 22, 25, 11.53, 15]
    },
    {
      id: "ipd_lr_daily_avg",
      name: "- ผู้ป่วย IPD+LR เฉลี่ยต่อวัน",
      category: "ipd",
      unit: "ราย/วัน",
      type: "rate",
      values: [19.25, 22.01, 25.29, 11.66, 15.48]
    },
    {
      id: "lr_bed_days",
      name: "วันนอนรวม LR",
      category: "ipd",
      unit: "วัน",
      type: "volume",
      values: [27, 80, 16, 16, 12]
    },
    {
      id: "ipd_occupancy_rate",
      name: "อัตราครองเตียง IPD",
      category: "ipd",
      unit: "%",
      type: "percentage",
      values: [63.93, 72.64, 83.22, 44.42, 51.47]
    },
    {
      id: "delivery_room_patients",
      name: "ผู้ป่วยห้องคลอด",
      category: "ipd",
      unit: "ราย",
      type: "volume",
      values: [11, 22, 6, 6, 8]
    },
    {
      id: "delivery_patients",
      name: "ผู้ป่วยคลอด",
      category: "ipd",
      unit: "ราย",
      type: "volume",
      values: [5, 10, 3, 3, 4]
    },
    {
      id: "refer_opd",
      name: "Refer OPD",
      category: "referral",
      unit: "ราย",
      type: "volume",
      values: [2157, 2914, 2767, 2433, 1831]
    },
    {
      id: "refer_er",
      name: "Refer ER",
      category: "referral",
      unit: "ราย",
      type: "volume",
      values: [627, 706, 718, 531, 447]
    },
    {
      id: "refer_ipd",
      name: "Refer IPD",
      category: "referral",
      unit: "ราย",
      type: "volume",
      values: [288, 488, 318, 200, 120]
    },
    {
      id: "refer_lr",
      name: "Refer LR",
      category: "referral",
      unit: "ราย",
      type: "volume",
      values: [0, 1, 2, 0, 4]
    },
    {
      id: "deaths_ipd",
      name: "จำนวนเสียชีวิต IPD",
      category: "mortality",
      unit: "ราย",
      type: "alert",
      values: [50, 56, 55, 78, 51]
    },
    {
      id: "deaths_er",
      name: "จำนวนเสียชีวิต ER",
      category: "mortality",
      unit: "ราย",
      type: "alert",
      values: [12, 9, 8, 8, 7]
    },
    {
      id: "homeward_patients",
      name: "จำนวนผู้ป่วย Home Ward",
      category: "home_ward",
      unit: "ราย",
      type: "growth",
      values: [0, 0, 50, 305, 425]
    },
    {
      id: "homeward_bed_days",
      name: "วันนอน Home Ward",
      category: "home_ward",
      unit: "วัน",
      type: "growth",
      values: [0, 0, 318, 2014, 3216]
    }
  ]
};

// Global active dataset store
let activeDataset = JSON.parse(JSON.stringify(FALLBACK_DATASET));
let lastSyncTimestamp = null;
let syncStatus = { isLive: false, source: "Embedded Fallback" };

/**
 * Fetch and parse CSV data from Google Sheets live export URL
 */
async function syncGoogleSheetsData() {
  try {
    const timestamp = new Date().getTime();
    const fetchUrl = `${GOOGLE_SHEETS_CSV_URL}&t=${timestamp}`;
    const response = await fetch(fetchUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const parsedData = parseGoogleSheetsCSV(csvText);
    
    if (parsedData && parsedData.metrics && parsedData.metrics.length > 0) {
      activeDataset = parsedData;
      syncStatus = { isLive: true, source: "Live Google Sheets Sync" };
      lastSyncTimestamp = new Date();
      return { success: true, isLive: true, message: "เชื่อมต่อข้อมูลสดเรียบร้อยแล้ว" };
    } else {
      throw new Error("โครงสร้างข้อมูล CSV ไม่ถูกต้อง");
    }
  } catch (err) {
    console.warn("Google Sheets Live Sync failed, falling back to embedded dataset:", err);
    activeDataset = JSON.parse(JSON.stringify(FALLBACK_DATASET));
    syncStatus = { isLive: false, source: "Offline Fallback Data" };
    lastSyncTimestamp = new Date();
    return { success: false, isLive: false, message: `ใช้ข้อมูลสำรอง (${err.message})` };
  }
}

/**
 * Parse Google Sheets CSV text into structured Dataset
 */
function parseGoogleSheetsCSV(csvText) {
  // Use PapaParse if available
  let rows = [];
  if (typeof Papa !== 'undefined') {
    const results = Papa.parse(csvText, { skipEmptyLines: true });
    rows = results.data;
  } else {
    // Simple CSV parser fallback
    rows = csvText.split('\n').map(line => {
      // split by comma considering quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : [];
    });
  }

  // Find header row with years (2565, 2566, 2567, 2568, 2569)
  let headerIndex = -1;
  let years = ["2565", "2566", "2567", "2568", "2569"];
  let yearLabels = ["2565", "2566", "2567", "2568", "2569 (10 เดือน)"];

  for (let i = 0; i < rows.length; i++) {
    const rowStr = rows[i].join(' ');
    if (rowStr.includes("2565") && rowStr.includes("2566")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return null;

  const datasetMetrics = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const rawName = row[0].trim();
    if (!rawName) continue;

    // Find matching fallback metric to inherit metadata (category, unit, etc.)
    const fallbackMatch = FALLBACK_DATASET.metrics.find(m => 
      m.name.trim().toLowerCase() === rawName.toLowerCase() ||
      rawName.toLowerCase().includes(m.name.trim().toLowerCase())
    );

    const values = [];
    for (let j = 1; j <= 5; j++) {
      let rawVal = row[j] ? row[j].toString().replace(/,/g, '').trim() : "0";
      let numVal = parseFloat(rawVal);
      values.push(isNaN(numVal) ? 0 : numVal);
    }

    datasetMetrics.push({
      id: fallbackMatch ? fallbackMatch.id : `metric_${i}`,
      name: rawName,
      category: fallbackMatch ? fallbackMatch.category : "opd_ncd",
      unit: fallbackMatch ? fallbackMatch.unit : "ราย",
      type: fallbackMatch ? fallbackMatch.type : "volume",
      values: values
    });
  }

  return {
    years: years,
    yearLabels: yearLabels,
    categories: FALLBACK_DATASET.categories,
    metrics: datasetMetrics.length > 0 ? datasetMetrics : FALLBACK_DATASET.metrics
  };
}

/**
 * Helper to get metric by ID
 */
function getMetric(metricId) {
  return activeDataset.metrics.find(m => m.id === metricId) || { values: [0,0,0,0,0], unit: "" };
}

/**
 * Calculate KPI Card Summary Metrics
 */
function getKpiSummary() {
  const opdAll = getMetric("outpatient_all");
  const ipdBed = getMetric("ipd_occupancy_rate");
  const homeWard = getMetric("homeward_patients");
  const homeWardDays = getMetric("homeward_bed_days");
  const referOpd = getMetric("refer_opd");
  const referEr = getMetric("refer_er");
  const referIpd = getMetric("refer_ipd");

  // Peak OPD (2567 = 104,733)
  const peakOpdValue = Math.max(...opdAll.values);
  const peakOpdIndex = opdAll.values.indexOf(peakOpdValue);
  const peakOpdYear = activeDataset.years[peakOpdIndex];

  // Peak Bed Occupancy Rate (2567 = 83.22%)
  const peakBedValue = Math.max(...ipdBed.values);
  const peakBedIndex = ipdBed.values.indexOf(peakBedValue);
  const peakBedYear = activeDataset.years[peakBedIndex];

  // Home Ward Latest Year (2569 = 425) & Total Bed Days (3,216 in 2569 or cumulative)
  const homeWardLatest = homeWard.values[4]; // 2569
  const homeWardBedDaysLatest = homeWardDays.values[4]; // 3216

  // Total Refer Out 2569 (Refer OPD + Refer ER + Refer IPD)
  const referTotal2566 = referOpd.values[1] + referEr.values[1] + referIpd.values[1]; // 4108
  const referTotal2569 = referOpd.values[4] + referEr.values[4] + referIpd.values[4]; // 2398
  const referDiffPct = (((referTotal2569 - referTotal2566) / referTotal2566) * 100).toFixed(1);

  return {
    peakOpd: {
      val: peakOpdValue.toLocaleString(),
      year: peakOpdYear,
      yoy: "+16.0% จาก 2566"
    },
    peakBed: {
      val: peakBedValue.toFixed(2) + "%",
      year: peakBedYear,
      badge: "ระดับสูง (High)"
    },
    homeWard: {
      val: homeWardLatest.toLocaleString() + " ราย",
      days: homeWardBedDaysLatest.toLocaleString() + " วันนอน",
      growth: "+750% ตั้งแต่ปี 2567"
    },
    referral: {
      val: referTotal2569.toLocaleString() + " ราย",
      diffPct: `${referDiffPct}%`,
      sub: "เทียบกับปี 2566 (4,108 ราย)"
    }
  };
}
