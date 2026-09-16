/**
 * Nong Muang Hospital Analytics Web Application - Table Manager
 * Dynamic Heatmap Data Table with Live Filtering & CSV Export
 */

let currentCategoryFilter = 'all';
let currentSearchQuery = '';

/**
 * Initialize and render the Heatmap Table
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
        <td colspan="7" class="px-6 py-8 text-center text-slate-400">
          <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 text-slate-300">
          <p class="text-sm">ไม่พบข้อมูลตัวชี้วัดที่ตรงกับคำค้นหา "${currentSearchQuery}"</p>
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

    // Calculate 5-year change percentage (2565 to 2569)
    const v2565 = metric.values[0];
    const v2569 = metric.values[4];
    let diffPctStr = "-";
    let diffClass = "text-slate-500";
    if (v2565 > 0) {
      const diffPct = (((v2569 - v2565) / v2565) * 100).toFixed(1);
      if (diffPct > 0) {
        diffPctStr = `+${diffPct}%`;
        diffClass = metric.type === 'alert' ? 'text-rose-600 font-medium' : 'text-emerald-600 font-medium';
      } else if (diffPct < 0) {
        diffPctStr = `${diffPct}%`;
        diffClass = metric.type === 'alert' ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium';
      } else {
        diffPctStr = `0%`;
      }
    }

    // Category Badge Color
    const catBadge = getCategoryBadgeHTML(metric.category);

    // Build row HTML
    let rowHtml = `
      <td class="px-5 py-3.5 text-sm font-medium text-slate-800 whitespace-nowrap sticky left-0 bg-inherit shadow-[1px_0_0_0_rgba(226,232,240,1)]">
        <div class="flex items-center gap-2">
          <span>${metric.name}</span>
          <span class="text-xs text-slate-400">(${metric.unit})</span>
        </div>
      </td>
      <td class="px-3 py-3.5 text-center text-xs whitespace-nowrap">
        ${catBadge}
      </td>
    `;

    // Render cells for years 2565 - 2569 with dynamic Heatmap background
    metric.values.forEach(val => {
      const heatStyle = getHeatmapCellStyle(val, minVal, maxVal, valRange, metric.type);
      const displayVal = metric.unit === '%' ? val.toFixed(2) + '%' : val.toLocaleString();

      rowHtml += `
        <td class="px-4 py-3.5 text-right text-sm font-mono whitespace-nowrap ${heatStyle.className}" style="${heatStyle.inlineStyle}">
          ${displayVal}
        </td>
      `;
    });

    rowHtml += `
      <td class="px-4 py-3.5 text-center text-xs font-mono whitespace-nowrap ${diffClass}">
        ${diffPctStr}
      </td>
    `;

    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

/**
 * Get Heatmap Cell Style & Class based on value relative to min-max
 */
function getHeatmapCellStyle(val, minVal, maxVal, range, metricType) {
  if (range === 0 || maxVal === 0) {
    return { className: 'text-slate-700', inlineStyle: '' };
  }

  const ratio = (val - minVal) / range; // 0.0 to 1.0

  if (metricType === 'alert') {
    // Red/Rose heatmap for high mortality/alert items
    if (ratio > 0.6) {
      const alpha = (0.08 + ratio * 0.22).toFixed(2);
      return {
        className: 'font-semibold text-rose-800',
        inlineStyle: `background-color: rgba(244, 63, 94, ${alpha});`
      };
    } else if (ratio > 0.3) {
      return {
        className: 'text-amber-800',
        inlineStyle: `background-color: rgba(245, 158, 11, 0.12);`
      };
    }
  } else {
    // Emerald/Teal heatmap for performance/volume items
    if (ratio > 0.7) {
      const alpha = (0.1 + ratio * 0.2).toFixed(2);
      return {
        className: 'font-semibold text-teal-900',
        inlineStyle: `background-color: rgba(13, 148, 136, ${alpha});`
      };
    } else if (ratio > 0.35) {
      const alpha = (0.05 + ratio * 0.1).toFixed(2);
      return {
        className: 'text-teal-800',
        inlineStyle: `background-color: rgba(13, 148, 136, ${alpha});`
      };
    }
  }

  return { className: 'text-slate-700', inlineStyle: '' };
}

/**
 * Category Badge HTML generator
 */
function getCategoryBadgeHTML(cat) {
  switch (cat) {
    case 'opd_ncd':
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">OPD/NCD</span>`;
    case 'er':
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">ER</span>`;
    case 'ipd':
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">IPD</span>`;
    case 'home_ward':
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Home Ward</span>`;
    case 'referral':
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">Refer</span>`;
    case 'mortality':
      return `<span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">เสียชีวิต</span>`;
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
  const headers = ["ตัวชี้วัด", "หน่วย", "หมวดหมู่", ...activeDataset.years];
  const rows = [headers];

  activeDataset.metrics.forEach(m => {
    rows.push([
      `"${m.name}"`,
      `"${m.unit}"`,
      `"${FALLBACK_DATASET.categories[m.category] || m.category}"`,
      ...m.values
    ]);
  });

  const csvContent = "\uFEFF" + rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `NongMuang_Hospital_Analytics_2565-2569.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
