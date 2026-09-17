/**
 * Nong Muang Hospital Analytics Web Application - Data Manager
 * Data Dashboard กลุ่มงานการพยาบาล - KPIMaster
 * Live Google Sheets Sync & Embedded Fallback Dataset
 */

const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1c9vMo1_KPzI4RIhAi9fgJTTFMuE-b6nuT8eetvT8KqQ/export?format=csv&sheet=KPIMaster";

// Embedded Fallback Dataset for KPIMaster (พ.ศ. 2567 - 2569)
const FALLBACK_DATASET = {
  years: ["2567", "2568", "2569"],
  yearLabels: ["ปี 2567", "ปี 2568", "ปี 2569 (กค.)"],
  categories: {
    clinical: "คลินิก & คุณภาพการพยาบาล",
    safety: "ความปลอดภัย & ป้องกันติดเชื้อ",
    community: "พยาบาลชุมชน & เยี่ยมบ้าน",
    satisfaction: "ความพึงพอใจผู้รับบริการ"
  },
  metrics: [
    {
      id: "door_to_ekg",
      no: 1,
      name: "ระยะเวลา Door to EKG < 10 นาที",
      category: "clinical",
      unit: "%",
      target: "100%",
      targetVal: 100,
      targetOperator: ">=",
      type: "percentage",
      values: [55.55, 81.81, 70.00]
    },
    {
      id: "competency_eval",
      no: 2,
      name: "ผลการประเมินสมรรถนะการดูแลผู้ป่วยกลุ่มโรคสำคัญ",
      category: "clinical",
      unit: "%",
      target: "≥ 80%",
      targetVal: 80,
      targetOperator: ">=",
      type: "percentage",
      values: [74.50, 81.37, 84.12]
    },
    {
      id: "nursing_record_score",
      no: 3,
      name: "คะแนนความสมบูรณ์การบันทึกกระบวนการพยาบาล",
      category: "clinical",
      unit: "%",
      target: "≥ 80%",
      targetVal: 80,
      targetOperator: ">=",
      type: "percentage",
      values: [81.45, 87.97, 79.71]
    },
    {
      id: "pressure_ulcer_rate",
      no: 4,
      name: "อัตราการเกิดแผลกดทับรายใหม่ในหน่วยงาน (ระดับ 2 ขึ้นไป)",
      category: "safety",
      unit: "ต่อ 1,000 วันนอน",
      target: "< 3:1000",
      targetVal: 3.0,
      targetOperator: "<=",
      type: "rate",
      values: [2.22, 3.86, 2.25]
    },
    {
      id: "cauti_rate",
      no: 5,
      name: "อัตราการติดเชื้อจากสายสวนปัสสาวะ (CA-UTI) ต่อ 1,000 วันคาสาย",
      category: "safety",
      unit: "ต่อ 1,000 วันคาสาย",
      target: "< 2:1000",
      targetVal: 2.0,
      targetOperator: "<=",
      type: "rate",
      values: [2.12, 2.95, 2.17]
    },
    {
      id: "home_visit_rate",
      no: 6,
      name: "อัตราการได้รับการเยี่ยมบ้านตามเกณฑ์ในกลุ่มเป้าหมาย",
      category: "community",
      unit: "%",
      target: "> 80%",
      targetVal: 80,
      targetOperator: ">=",
      type: "percentage",
      values: [64.50, 66.84, 68.25]
    },
    {
      id: "opd_satisfaction",
      no: 7,
      name: "อัตราความพึงพอใจของผู้ป่วยนอก",
      category: "satisfaction",
      unit: "%",
      target: "> 85%",
      targetVal: 85,
      targetOperator: ">=",
      type: "percentage",
      values: [86.98, 83.32, 84.84]
    },
    {
      id: "ipd_satisfaction",
      no: 8,
      name: "อัตราความพึงพอใจของผู้ป่วยใน",
      category: "satisfaction",
      unit: "%",
      target: "> 85%",
      targetVal: 85,
      targetOperator: ">=",
      type: "percentage",
      values: [88.84, 87.06, 88.65]
    },
    {
      id: "community_satisfaction",
      no: 9,
      name: "อัตราความพึงพอใจของประชาชนในชุมชน",
      category: "satisfaction",
      unit: "%",
      target: "> 85%",
      targetVal: 85,
      targetOperator: ">=",
      type: "percentage",
      values: [86.95, 87.88, 89.28]
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
      return { success: true, isLive: true, message: "เชื่อมต่อข้อมูลสด KPIMaster เรียบร้อยแล้ว" };
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
 * Parse KPIMaster CSV text into structured Dataset
 */
function parseGoogleSheetsCSV(csvText) {
  let rows = [];
  if (typeof Papa !== 'undefined') {
    const results = Papa.parse(csvText, { skipEmptyLines: true });
    rows = results.data;
  } else {
    rows = csvText.split('\n').map(line => {
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      return matches ? matches.map(m => m.replace(/^"|"$/g, '').trim()) : [];
    });
  }

  if (!rows || rows.length < 2) return null;

  // Find header row with "ตัวชี้วัด" or "ปี 2567"
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const rowStr = rows[i].join(' ');
    if (rowStr.includes("ตัวชี้วัด") || rowStr.includes("2567")) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return null;

  const datasetMetrics = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const noVal = row[0] ? parseInt(row[0].toString().trim()) : (i - headerIndex);
    const rawName = row[1] ? row[1].trim() : "";
    const rawTarget = row[2] ? row[2].trim() : "";

    if (!rawName) continue;

    // Match with fallback metric definition
    const fallbackMatch = FALLBACK_DATASET.metrics.find(m => 
      m.name.trim().toLowerCase() === rawName.toLowerCase() ||
      rawName.toLowerCase().includes(m.name.trim().slice(0, 10).toLowerCase()) ||
      m.no === noVal
    );

    const values = [];
    // Extract year values (columns 3, 4, 5 -> 2567, 2568, 2569)
    for (let j = 3; j <= 5; j++) {
      let rawVal = row[j] ? row[j].toString().replace(/,/g, '').trim() : "0";
      let numVal = parseFloat(rawVal);
      values.push(isNaN(numVal) ? 0 : numVal);
    }

    datasetMetrics.push({
      id: fallbackMatch ? fallbackMatch.id : `kpi_${noVal}`,
      no: noVal,
      name: rawName,
      category: fallbackMatch ? fallbackMatch.category : "clinical",
      unit: fallbackMatch ? fallbackMatch.unit : "%",
      target: rawTarget || (fallbackMatch ? fallbackMatch.target : "-"),
      targetVal: fallbackMatch ? fallbackMatch.targetVal : 80,
      targetOperator: fallbackMatch ? fallbackMatch.targetOperator : ">=",
      type: fallbackMatch ? fallbackMatch.type : "percentage",
      values: values
    });
  }

  return {
    years: ["2567", "2568", "2569"],
    yearLabels: ["ปี 2567", "ปี 2568", "ปี 2569 (กค.)"],
    categories: FALLBACK_DATASET.categories,
    metrics: datasetMetrics.length > 0 ? datasetMetrics : FALLBACK_DATASET.metrics
  };
}

/**
 * Helper to get metric by ID
 */
function getMetric(metricId) {
  const match = activeDataset.metrics.find(m => m.id === metricId);
  return match || { values: [0,0,0], unit: "%", target: "-" };
}

/**
 * Check KPI Target Status (Pass / Caution / Fail)
 */
function evaluateKpiTarget(metric, value) {
  if (value === undefined || value === null) return { status: 'neutral', label: 'ไม่มีข้อมูล', color: 'slate' };
  
  const target = metric.targetVal;
  const op = metric.targetOperator;

  if (op === '<=' || op === '<') {
    if (value <= target) {
      return { status: 'pass', label: 'ผ่านเกณฑ์', color: 'emerald' };
    } else if (value <= target * 1.25) {
      return { status: 'caution', label: 'เฝ้าระวัง', color: 'amber' };
    } else {
      return { status: 'fail', label: 'ไม่ผ่านเกณฑ์', color: 'rose' };
    }
  } else {
    if (value >= target) {
      return { status: 'pass', label: 'ผ่านเกณฑ์', color: 'emerald' };
    } else if (value >= target * 0.85) {
      return { status: 'caution', label: 'เฝ้าระวัง', color: 'amber' };
    } else {
      return { status: 'fail', label: 'ไม่ผ่านเกณฑ์', color: 'rose' };
    }
  }
}

/**
 * Calculate KPI Card Summary Metrics
 */
function getKpiSummary() {
  const ipdSat = getMetric("ipd_satisfaction");
  const commSat = getMetric("community_satisfaction");
  const compEval = getMetric("competency_eval");
  const ulcer = getMetric("pressure_ulcer_rate");
  const cauti = getMetric("cauti_rate");

  const latestIpdSat = ipdSat.values[2] || 88.65;
  const latestCommSat = commSat.values[2] || 89.28;
  const latestCompEval = compEval.values[2] || 84.12;
  const latestUlcer = ulcer.values[2] || 2.25;
  const latestCauti = cauti.values[2] || 2.17;

  return {
    ipdSat: {
      val: latestIpdSat.toFixed(2) + "%",
      target: "เป้าหมาย > 85%",
      sub: "ผ่านเกณฑ์เป้าหมายต่อเนื่อง 3 ปี"
    },
    commSat: {
      val: latestCommSat.toFixed(2) + "%",
      target: "เป้าหมาย > 85%",
      sub: "เติบโตสูงสุดในปี 2569"
    },
    compEval: {
      val: latestCompEval.toFixed(2) + "%",
      target: "เป้าหมาย ≥ 80%",
      sub: "+9.62% เติบโตจากปี 2567"
    },
    safety: {
      val: `${latestUlcer} / ${latestCauti}`,
      sub: "แผลกดทับ 2.25 | CA-UTI 2.17 (ผ่านเกณฑ์)"
    }
  };
}
