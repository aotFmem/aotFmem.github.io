/**
 * Nong Muang Hospital Analytics Web Application - Main Controller
 * Data Dashboard กลุ่มงานการพยาบาล - KPIMaster
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) lucide.createIcons();

  initTabNavigation();
  initSyncControls();
  initTableControls();

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

  showToast('กำลังเชื่อมต่อข้อมูลสด KPIMaster จาก Google Sheets...', 'info');

  const result = await syncGoogleSheetsData();

  if (syncIcon) {
    syncIcon.classList.remove('animate-spin');
  }
  if (syncBtn) {
    syncBtn.disabled = false;
    syncBtn.classList.remove('opacity-75');
  }

  updateStatusBadge(result);
  updateKpiCards();

  const activeTabBtn = document.querySelector('.nav-tab.active');
  const activeTabId = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : 'tab-overview';
  updateDashboardCharts(activeTabId);

  renderHeatmapTable();

  if (result.isLive) {
    showToast('อัปเดตข้อมูลสด KPIMaster จาก Google Sheets สำเร็จ!', 'success');
  } else {
    showToast(`ใช้งานข้อมูลสำรอง KPIMaster (${result.message})`, 'warning');
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
        Live KPIMaster Sync
      `;
    } else {
      badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold status-badge-fallback shadow-sm';
      badge.innerHTML = `
        <span class="inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        Offline Fallback KPIMaster
      `;
    }
  }

  if (lastSyncText && lastSyncTimestamp) {
    const timeStr = lastSyncTimestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    lastSyncText.textContent = `อัปเดตล่าสุด: ${timeStr} น.`;
  }
}

/**
 * Update 4 KPI Highlight Cards for Nursing KPIMaster
 */
function updateKpiCards() {
  const kpi = getKpiSummary();

  // Card 1: IPD Satisfaction
  const kpiOpdVal = document.getElementById('kpiOpdVal');
  const kpiOpdSub = document.getElementById('kpiOpdSub');
  if (kpiOpdVal) kpiOpdVal.textContent = kpi.ipdSat.val;
  if (kpiOpdSub) kpiOpdSub.textContent = `${kpi.ipdSat.target} (${kpi.ipdSat.sub})`;

  // Card 2: Community Satisfaction
  const kpiBedVal = document.getElementById('kpiBedVal');
  const kpiBedSub = document.getElementById('kpiBedSub');
  if (kpiBedVal) kpiBedVal.textContent = kpi.commSat.val;
  if (kpiBedSub) kpiBedSub.textContent = `${kpi.commSat.target} (${kpi.commSat.sub})`;

  // Card 3: Competency Evaluation
  const kpiHomeVal = document.getElementById('kpiHomeVal');
  const kpiHomeSub = document.getElementById('kpiHomeSub');
  if (kpiHomeVal) kpiHomeVal.textContent = kpi.compEval.val;
  if (kpiHomeSub) kpiHomeSub.textContent = `${kpi.compEval.target} (${kpi.compEval.sub})`;

  // Card 4: Patient Safety (Pressure Ulcers & CA-UTI)
  const kpiReferVal = document.getElementById('kpiReferVal');
  const kpiReferSub = document.getElementById('kpiReferSub');
  if (kpiReferVal) kpiReferVal.textContent = kpi.safety.val;
  if (kpiReferSub) kpiReferSub.textContent = kpi.safety.sub;
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

      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(content => {
        if (content.id === targetTab) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });

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
