/**
 * Nong Muang Hospital Analytics Web Application - Table Manager
 * Data Dashboard กลุ่มงานการพยาบาล - KPIMaster Heatmap Table
 */

let currentCategoryFilter = 'all';
let currentSearchQuery = '';

/**
 * Initialize and render the KPIMaster Heatmap Table
 */
function renderHeatmapTable() {
  const tbody = document.getElementById('heatmapTableBody');
  const countBadge = document.getElementById('tableItemCount');
  if (!tbody) return;

  tbody.innerHTML = '';

  const metrics = activeDataset.metrics;
  const filteredMetrics = metrics.filter(metric => {
    const matchesCategory = (currentCategoryFilter === 'all') || (metric.category === currentCategoryFilter);
    const matchesSearch = metric.name.toLowerCase().includes(currentSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (countBadge) {
    countBadge.textContent = `${filteredMetrics.length} / ${metrics.length} รายการ`;
  }

  if (filteredMetrics.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-8 text-center text-slate-400">
          <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
          <p class="text-sm">ไม่พบตัวชี้วัดที่ตรงกับคำค้นหา "${currentSearchQuery}"</p>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  filteredMetrics.forEach((metric, index) => {
    const tr = document.createElement('tr');
    tr.className = index % 2 === 0 ? 'bg-white hover:bg-slate-50 transition-colors' : 'bg-slate-50/50 hover:bg-slate-100/50 transition-colors';

    // Calculate row min & max for heatmap shading
    const validVals = metric.values.filter(v => typeof v === 'number');
    const minVal = Math.min(...validVals);
    const maxVal = Math.max(...validVals);
    const valRange = maxVal - minVal;

    // Evaluate latest year status vs target
    const latestVal = metric.values[2];
    const targetEval = evaluateKpiTarget(metric, latestVal);
    const statusBadge = getStatusBadgeHTML(targetEval);

    const catBadge = getCategoryBadgeHTML(metric.category);

    // Build row HTML
    let rowHtml = `
      <td class="px-3 py-3.5 text-center text-xs font-mono font-bold text-slate-500 whitespace-nowrap">
        ${metric.no || (index + 1)}
      </td>
      <td class="px-4 py-3.5 text-sm font-medium text-slate-800 sticky left-0 bg-inherit shadow-[1px_0_0_0_rgba(226,232,240,1)]">
        <div class="flex flex-col">
          <span class="font-semibold text-slate-900">${metric.name}</span>
          <span class="text-xs text-slate-400">หน่วย: ${metric.unit}</span>
        </div>
      </td>
      <td class="px-3 py-3.5 text-center text-xs whitespace-nowrap">
        ${catBadge}
      </td>
      <td class="px-3 py-3.5 text-center text-xs font-mono font-semibold text-indigo-700 bg-indigo-50/50 rounded-lg whitespace-nowrap">
        ${metric.target}
      </td>
    `;

    // Render cells for years 2567, 2568, 2569 with dynamic Heatmap background
    metric.values.forEach(val => {
      const heatStyle = getHeatmapCellStyle(val, minVal, maxVal, valRange, metric.targetOperator);
      const displayVal = val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

      rowHtml += `
        <td class="px-4 py-3.5 text-right text-sm font-mono whitespace-nowrap ${heatStyle.className}" style="${heatStyle.inlineStyle}">
          ${displayVal}
        </td>
      `;
    });

    rowHtml += `
      <td class="px-4 py-3.5 text-center whitespace-nowrap">
        ${statusBadge}
      </td>
    `;

    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

/**
 * Get Heatmap Cell Style
 */
function getHeatmapCellStyle(val, minVal, maxVal, range, operator) {
  if (range === 0 || maxVal === 0) {
    return { className: 'text-slate-700', inlineStyle: '' };
  }

  const ratio = (val - minVal) / range; // 0.0 to 1.0

  if (operator === '<=' || operator === '<') {
    // Lower is better (e.g. pressure ulcers, CA-UTI) -> lower values green, higher values red
    if (ratio > 0.6) {
      return { className: 'font-semibold text-rose-800', inlineStyle: `background-color: rgba(244, 63, 94, 0.15);` };
    } else if (ratio < 0.4) {
      return { className: 'font-semibold text-teal-900', inlineStyle: `background-color: rgba(13, 148, 136, 0.15);` };
    }
  } else {
    // Higher is better (e.g. satisfaction, competencies) -> higher values green
    if (ratio > 0.6) {
      return { className: 'font-semibold text-teal-900', inlineStyle: `background-color: rgba(13, 148, 136, 0.18);` };
    } else if (ratio < 0.3) {
      return { className: 'text-amber-800', inlineStyle: `background-color: rgba(245, 158, 11, 0.12);` };
    }
  }

  return { className: 'text-slate-700', inlineStyle: '' };
}

/**
 * Status Badge HTML
 */
function getStatusBadgeHTML(evalResult) {
  if (evalResult.status === 'pass') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ผ่านเกณฑ์
    </span>`;
  } else if (evalResult.status === 'caution') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> เฝ้าระวัง
    </span>`;
  } else if (evalResult.status === 'fail') {
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
      <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> ไม่ผ่านเกณฑ์
    </span>`;
  }
  return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">-</span>`;
}

/**
 * Category Badge HTML generator
 */
function getCategoryBadgeHTML(cat) {
  switch (cat) {
    case 'clinical':
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">คลินิก</span>`;
    case 'safety':
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">ความปลอดภัย</span>`;
    case 'community':
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">ชุมชน</span>`;
    case 'satisfaction':
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">ความพึงพอใจ</span>`;
    default:
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">ทั่วไป</span>`;
  }
}

/**
 * Filter Listeners Initialization
 */
function initTableControls() {
  const searchInput = document.getElementById('tableSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderHeatmapTable();
    });
  }

  const categoryBtns = document.querySelectorAll('.category-filter-btn');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => {
        b.classList.remove('bg-teal-600', 'text-white');
        b.classList.add('bg-white', 'text-slate-600', 'hover:bg-slate-100');
      });

      btn.classList.remove('bg-white', 'text-slate-600', 'hover:bg-slate-100');
      btn.classList.add('bg-teal-600', 'text-white');

      currentCategoryFilter = btn.getAttribute('data-category');
      renderHeatmapTable();
    });
  });

  const exportBtn = document.getElementById('btnExportCsv');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportTableToCSV);
  }
}

/**
 * Export Active Table Dataset to CSV File
 */
function exportTableToCSV() {
  const headers = ["ลำดับ", "ตัวชี้วัดการพยาบาล", "หน่วย", "เป้าหมาย", "หมวดหมู่", ...activeDataset.years, "สถานะปีล่าสุด"];
  const rows = [headers];

  activeDataset.metrics.forEach((m, idx) => {
    const latestVal = m.values[2];
    const targetEval = evaluateKpiTarget(m, latestVal);

    rows.push([
      m.no || (idx + 1),
      `"${m.name}"`,
      `"${m.unit}"`,
      `"${m.target}"`,
      `"${FALLBACK_DATASET.categories[m.category] || m.category}"`,
      ...m.values,
      `"${targetEval.label}"`
    ]);
  });

  const csvContent = "\uFEFF" + rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Data_Dashboard_Nursing_KPIMaster_2567-2569.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
