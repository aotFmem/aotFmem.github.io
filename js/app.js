/**
 * Nong Muang Hospital Analytics Web Application - Main Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Lucide Icons
  if (window.lucide) lucide.createIcons();

  // Setup Event Listeners
  initTabNavigation();
  initSyncControls();
  initTableControls();

  // Perform Initial Sync (Live Google Sheets Sync or Fallback)
  await performDataSync();
});

/**
 * Perform Data Synchronization and update UI components
 */
async function performDataSync() {
  const syncBtn = document.getElementById('btnSyncData');
  const syncIcon = document.getElementById('syncIcon');
  
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.classList.add('opacity-75');
  }
  if (syncIcon) {
    syncIcon.classList.add('animate-spin');
  }

  showToast('กำลังเชื่อมต่อข้อมูลจาก Google Sheets...', 'info');

  const result = await syncGoogleSheetsData();

  if (syncIcon) {
    syncIcon.classList.remove('animate-spin');
  }
  if (syncBtn) {
    syncBtn.disabled = false;
    syncBtn.classList.remove('opacity-75');
  }

  // Update Status Badge & Metadata
  updateStatusBadge(result);

  // Refresh KPI Cards
  updateKpiCards();

  // Refresh Active Tab Charts
  const activeTabBtn = document.querySelector('.nav-tab.active');
  const activeTabId = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'tab-overview';
  updateDashboardCharts(activeTabId);

  // Refresh Heatmap Table
  renderHeatmapTable();

  if (result.isLive) {
    showToast('อัปเดตข้อมูลสดจาก Google Sheets สำเร็จ!', 'success');
  } else {
    showToast(`ใช้งานข้อมูลสำรอง (${result.message})`, 'warning');
  }
}

/**
 * Update Connection Status Badge in Header
 */
function updateStatusBadge(syncResult) {
  const badge = document.getElementById('statusBadge');
  const lastSyncText = document.getElementById('lastSyncTime');

  if (badge) {
    if (syncResult.isLive) {
      badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold status-badge-live shadow-sm';
      badge.innerHTML = `
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Live Google Sheets Sync
      `;
    } else {
      badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold status-badge-fallback shadow-sm';
      badge.innerHTML = `
        <span class="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        Offline Fallback Data
      `;
    }
  }

  if (lastSyncText && lastSyncTimestamp) {
    const timeStr = lastSyncTimestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastSyncText.textContent = `อัปเดตล่าสุด: ${timeStr} น.`;
  }
}

/**
 * Update 4 KPI Highlight Cards with dynamic metrics
 */
function updateKpiCards() {
  const kpi = getKpiSummary();

  // Card 1: Peak OPD
  const kpiOpdVal = document.getElementById('kpiOpdVal');
  const kpiOpdSub = document.getElementById('kpiOpdSub');
  if (kpiOpdVal) kpiOpdVal.textContent = kpi.peakOpd.val;
  if (kpiOpdSub) kpiOpdSub.textContent = `สูงสุดในปี ${kpi.peakOpd.year} (${kpi.peakOpd.yoy})`;

  // Card 2: Peak Bed Occupancy
  const kpiBedVal = document.getElementById('kpiBedVal');
  const kpiBedSub = document.getElementById('kpiBedSub');
  if (kpiBedVal) kpiBedVal.textContent = kpi.peakBed.val;
  if (kpiBedSub) kpiBedSub.textContent = `สูงสุดในปี ${kpi.peakBed.year} (ความหนาแน่นสูง)`;

  // Card 3: Home Ward
  const kpiHomeVal = document.getElementById('kpiHomeVal');
  const kpiHomeSub = document.getElementById('kpiHomeSub');
  if (kpiHomeVal) kpiHomeVal.textContent = kpi.homeWard.val;
  if (kpiHomeSub) kpiHomeSub.textContent = `${kpi.homeWard.days} (${kpi.homeWard.growth})`;

  // Card 4: Refer Out
  const kpiReferVal = document.getElementById('kpiReferVal');
  const kpiReferSub = document.getElementById('kpiReferSub');
  if (kpiReferVal) kpiReferVal.textContent = kpi.referral.val;
  if (kpiReferSub) kpiReferSub.textContent = `ลดลง ${kpi.referral.diffPct} ${kpi.referral.sub}`;
}

/**
 * Initialize Tab Navigation Switcher
 */
function initTabNavigation() {
  const tabBtns = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Update Nav Buttons State
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update Tab Views
      tabContents.forEach(content => {
        if (content.id === targetTab) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });

      // Refresh Charts for selected tab
      updateDashboardCharts(targetTab);
    });
  });
}

/**
 * Initialize Header Sync Controls
 */
function initSyncControls() {
  const btnSync = document.getElementById('btnSyncData');
  if (btnSync) {
    btnSync.addEventListener('click', () => {
      performDataSync();
    });
  }
}

/**
 * Show Toast Notifications
 */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toastText');
  const toastIcon = document.getElementById('toastIcon');

  if (!toast || !toastText) return;

  toastText.textContent = message;

  if (type === 'success') {
    toast.className = 'fixed bottom-5 right-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-emerald-500/50 z-50 transition-all duration-300 transform translate-y-0 opacity-100';
    if (toastIcon) toastIcon.setAttribute('data-lucide', 'check-circle-2');
  } else if (type === 'warning') {
    toast.className = 'fixed bottom-5 right-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-amber-500/50 z-50 transition-all duration-300 transform translate-y-0 opacity-100';
    if (toastIcon) toastIcon.setAttribute('data-lucide', 'alert-triangle');
  } else {
    toast.className = 'fixed bottom-5 right-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl border border-teal-500/50 z-50 transition-all duration-300 transform translate-y-0 opacity-100';
    if (toastIcon) toastIcon.setAttribute('data-lucide', 'info');
  }

  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.className = 'fixed bottom-5 right-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl z-50 transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none';
  }, 3500);
}
