// ============================================================
// APLICACIÓN PRINCIPAL - DASHBOARD OPERATIVO TADA / PIBOX
// Sincronización en Tiempo Real, Cobertura Preventiva y Analítica
// ============================================================

const AppState = {
  activeTab: 'malla',
  temporal: null,
  mallaShifts: [],
  progShifts: [],
  filteredMalla: [],
  filteredProg: [],
  pilotsList: [],
  selectedPilot: null,
  coverageAnalysis: null,
  targetShiftForSuplente: null,
  selectedModulo3Week: null,
  availableWeeks: [],
  selectedDays: [],
  selectedStartTimes: [],
  selectedStatuses: [],
  selectedRankingStore: null,
  // Paginación de Malla
  mallaPage: 1,
  mallaPageSize: 100,
  // In-table search strings
  mallaSearch: '',
  coberturaSearch: '',
  flotaSearch: ''
};

// Instancias globales de multiselect
let multiSelectDia = null;
let multiSelectInicio = null;
let multiSelectEstado = null;

// Utilidades de formateo
const fmtNum = (n, dec = 0) => (n == null || isNaN(n)) ? '—' : new Intl.NumberFormat('es-CO', { maximumFractionDigits: dec }).format(n);
const fmtPct = (n) => (n == null || isNaN(n)) ? '—' : (n).toFixed(1) + '%';
const fmtMinutes = (m) => {
  if (m == null || isNaN(m)) return '—';
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[m]));

// parseHybridDate está unificada y declarada globalmente en rules.js (Single Source of Truth)

/**
 * Componente Vanilla Multiselect con checkboxes y diseño nativo TaDa
 */
class CustomMultiSelect {
  constructor({ containerId, options = [], placeholder = 'Todos', onChange }) {
    this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    this.options = options;
    this.placeholder = placeholder;
    this.onChange = onChange;
    this.selected = new Set();
    this.isOpen = false;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.bindEvents();
  }

  setOptions(newOptions) {
    this.options = newOptions || [];
    const validVals = new Set(this.options.map(o => (typeof o === 'object' ? o.value : o)));
    this.selected.forEach(v => {
      if (!validVals.has(v)) this.selected.delete(v);
    });
    this.render();
    this.bindEvents();
  }

  getSelected() {
    return Array.from(this.selected);
  }

  setSelected(vals) {
    this.selected = new Set(vals || []);
    this.updateButtonLabel();
    this.updateCheckboxes();
  }

  clear() {
    this.selected.clear();
    this.updateButtonLabel();
    this.updateCheckboxes();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <button type="button" class="multiselect-btn" aria-expanded="false">
        <span class="multiselect-btn-text">${this.placeholder}</span>
        <span class="multiselect-arrow">▾</span>
      </button>
      <div class="multiselect-dropdown" style="display: none;">
        <div class="multiselect-actions">
          <button type="button" class="btn-action-all">Todos</button>
          <button type="button" class="btn-action-none">Limpiar</button>
        </div>
        <div class="multiselect-options-list">
          ${this.options.map(opt => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            const checked = this.selected.has(val) ? 'checked' : '';
            return `
              <label class="multiselect-option">
                <input type="checkbox" value="${escapeHtml(val)}" ${checked}>
                <span>${escapeHtml(lbl)}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
    this.updateButtonLabel();
  }

  bindEvents() {
    if (!this.container) return;
    const btn = this.container.querySelector('.multiselect-btn');
    const dropdown = this.container.querySelector('.multiselect-dropdown');
    const btnAll = this.container.querySelector('.btn-action-all');
    const btnNone = this.container.querySelector('.btn-action-none');

    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.multiselect-dropdown').forEach(d => {
        if (d !== dropdown) d.style.display = 'none';
      });
      this.isOpen = dropdown.style.display === 'block' ? false : true;
      dropdown.style.display = this.isOpen ? 'block' : 'none';
      btn.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');
    });

    btnAll?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.options.forEach(opt => {
        const val = typeof opt === 'object' ? opt.value : opt;
        this.selected.add(val);
      });
      this.updateButtonLabel();
      this.updateCheckboxes();
      if (this.onChange) this.onChange(this.getSelected());
    });

    btnNone?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selected.clear();
      this.updateButtonLabel();
      this.updateCheckboxes();
      if (this.onChange) this.onChange(this.getSelected());
    });

    this.container.querySelector('.multiselect-options-list')?.addEventListener('change', (e) => {
      if (e.target && e.target.type === 'checkbox') {
        const val = e.target.value;
        if (e.target.checked) {
          this.selected.add(val);
        } else {
          this.selected.delete(val);
        }
        this.updateButtonLabel();
        if (this.onChange) this.onChange(this.getSelected());
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        if (dropdown) dropdown.style.display = 'none';
        this.isOpen = false;
        btn?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  updateButtonLabel() {
    const txt = this.container?.querySelector('.multiselect-btn-text');
    if (!txt) return;
    const count = this.selected.size;
    if (count === 0) {
      txt.innerText = this.placeholder;
      txt.classList.remove('has-selection');
    } else if (count === 1) {
      const firstVal = Array.from(this.selected)[0];
      const opt = this.options.find(o => (typeof o === 'object' ? o.value : o) === firstVal);
      txt.innerText = typeof opt === 'object' ? opt.label : firstVal;
      txt.classList.add('has-selection');
    } else if (count === this.options.length) {
      txt.innerText = `Todos (${count})`;
      txt.classList.add('has-selection');
    } else {
      txt.innerText = `${count} seleccionados`;
      txt.classList.add('has-selection');
    }
  }

  updateCheckboxes() {
    this.container?.querySelectorAll('.multiselect-option input[type="checkbox"]').forEach(cb => {
      cb.checked = this.selected.has(cb.value);
    });
  }
}

// Función de sanitización estricta de la ventana temporal
// Garantiza que la semana actual siempre cierre de Lunes a Domingo (7 días exactos: +6 días desde el lunes)
function sanitizeTemporalWindow(temporal) {
  if (!temporal || !temporal.currentWeek) return temporal;
  const startD = parseDateToNoon(temporal.currentWeek.startDate);
  if (startD) {
    const sunD = new Date(startD);
    sunD.setDate(startD.getDate() + 6);
    sunD.setHours(12, 0, 0, 0);
    const correctSundayIso = formatDateToNoonIso(sunD);

    if (temporal.currentWeek.endDate !== correctSundayIso) {
      console.warn(`[sanitizeTemporalWindow] Corrigiendo endDate de ${temporal.currentWeek.endDate} a ${correctSundayIso} (7 días exactos)`);
      temporal.currentWeek.endDate = correctSundayIso;
      temporal.windowEnd = correctSundayIso;
    }
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    temporal.currentWeek.label = `Sem ${temporal.currentWeek.weekNumber} (${startD.getDate()} ${monthNames[startD.getMonth()]} – ${sunD.getDate()} ${monthNames[sunD.getMonth()]} ${sunD.getFullYear()})`;
  }
  return temporal;
}

// ============================================================
// PERSISTENCIA DE FILTROS EN LOCALSTORAGE
// ============================================================
const FILTER_STORAGE_KEY = 'tada_dashboard_filters_v16';

function saveFiltersToStorage() {
  try {
    const state = {
      city:      document.getElementById('filterCity')?.value || '',
      store:     document.getElementById('filterStore')?.value || '',
      from:      document.getElementById('filterFrom')?.value || '',
      to:        document.getElementById('filterTo')?.value || '',
      semana:    document.getElementById('filterSemana')?.value || '',
      pilot:     document.getElementById('filterPilot')?.value || '',
      demand:    document.getElementById('filterDemand')?.value || '',
      days:      AppState.selectedDays || [],
      startTimes: AppState.selectedStartTimes || [],
      statuses:  AppState.selectedStatuses || []
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* silent */ }
}

function loadFiltersFromStorage() {
  try {
    const raw = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    const setVal = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
    setVal('filterCity',   state.city);
    setVal('filterStore',  state.store);
    setVal('filterFrom',   state.from);
    setVal('filterTo',     state.to);
    setVal('filterSemana', state.semana);
    setVal('filterPilot',  state.pilot);
    setVal('filterDemand', state.demand);
    if (state.days?.length) {
      AppState.selectedDays = state.days;
      multiSelectDia?.setSelected(state.days);
    }
    if (state.startTimes?.length) {
      AppState.selectedStartTimes = state.startTimes;
      multiSelectInicio?.setSelected(state.startTimes);
    }
    if (state.statuses?.length) {
      AppState.selectedStatuses = state.statuses;
      multiSelectEstado?.setSelected(state.statuses);
    }
  } catch (e) { /* silent */ }
}

// ============================================================
// BARRA DE FILTROS ACTIVOS (Badges)
// ============================================================
function updateActiveFiltersBadges() {
  const bar   = document.getElementById('activeFiltersBar');
  const cont  = document.getElementById('activeFilterBadges');
  if (!bar || !cont) return;

  const badges = [];

  const city   = document.getElementById('filterCity')?.value;
  const store  = document.getElementById('filterStore')?.value;
  const from   = document.getElementById('filterFrom')?.value;
  const to     = document.getElementById('filterTo')?.value;
  const pilot  = document.getElementById('filterPilot')?.value?.trim();
  const demand = document.getElementById('filterDemand')?.value;
  const semana = document.getElementById('filterSemana');
  const semanaLabel = semana?.options[semana.selectedIndex]?.text;

  if (city)   badges.push({ label: `Ciudad: ${city}`,      clear: () => { document.getElementById('filterCity').value = ''; applyFilters(); } });
  if (store)  badges.push({ label: `Tienda: ${store}`,     clear: () => { document.getElementById('filterStore').value = ''; applyFilters(); } });
  if (from)   badges.push({ label: `Desde: ${from}`,       clear: () => { document.getElementById('filterFrom').value = ''; document.getElementById('filterFromPicker').value = ''; applyFilters(); } });
  if (to)     badges.push({ label: `Hasta: ${to}`,         clear: () => { document.getElementById('filterTo').value = ''; document.getElementById('filterToPicker').value = ''; applyFilters(); } });
  if (pilot)  badges.push({ label: `Piloto: ${pilot}`,     clear: () => { document.getElementById('filterPilot').value = ''; applyFilters(); } });
  if (demand) badges.push({ label: `Demanda: ${demand === 'low' ? 'Baja' : 'Normal'}`, clear: () => { document.getElementById('filterDemand').value = ''; applyFilters(); } });
  if (semana?.value && semanaLabel) badges.push({ label: `Semana: ${semanaLabel.substring(0, 30)}`, clear: () => { document.getElementById('filterSemana').value = ''; document.getElementById('filterFrom').value = ''; document.getElementById('filterTo').value = ''; applyFilters(); } });
  if (AppState.selectedDays?.length) badges.push({ label: `Días: ${AppState.selectedDays.join(', ')}`, clear: () => { AppState.selectedDays = []; multiSelectDia?.clear(); applyFilters(); } });
  if (AppState.selectedStartTimes?.length) badges.push({ label: `Inicio: ${AppState.selectedStartTimes.join(', ')}`, clear: () => { AppState.selectedStartTimes = []; multiSelectInicio?.clear(); applyFilters(); } });
  if (AppState.selectedStatuses?.length) badges.push({ label: `Estado: ${AppState.selectedStatuses.join(', ')}`, clear: () => { AppState.selectedStatuses = []; multiSelectEstado?.clear(); applyFilters(); } });

  if (badges.length > 0) {
    bar.classList.add('visible');
    cont.innerHTML = badges.map((b, i) =>
      `<span class="filter-badge" onclick="clearFilterBadge(${i})" title="Quitar este filtro">${escapeHtml(b.label)} <span class="badge-x">×</span></span>`
    ).join('');
    // Store clear callbacks on window for onclick
    window._filterBadgeClears = badges.map(b => b.clear);
  } else {
    bar.classList.remove('visible');
    cont.innerHTML = '';
    window._filterBadgeClears = [];
  }
}

function clearFilterBadge(idx) {
  if (window._filterBadgeClears && window._filterBadgeClears[idx]) {
    window._filterBadgeClears[idx]();
  }
}

// ============================================================
// SKELETON LOADERS
// ============================================================
function showSkeletonKpis() {
  const container = document.getElementById('kpisContainer');
  if (!container) return;
  container.innerHTML = Array(9).fill(0).map(() =>
    `<div class="kpi-card skeleton skeleton-kpi"></div>`
  ).join('');
}

function showSkeletonTable(tbodyId, cols = 10, rows = 8) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = Array(rows).fill(0).map(() =>
    `<tr>${Array(cols).fill(0).map(() =>
      `<td><div class="skeleton skeleton-row" style="width:${60+Math.random()*35}%;"></div></td>`
    ).join('')}</tr>`
  ).join('');
}

// ============================================================
// SELECTOR DE COLUMNAS (Column Visibility)
// ============================================================
function setupColumnSelector(btnId, dropdownId, tableId) {
  const btn      = document.getElementById(btnId);
  const dropdown = document.getElementById(dropdownId);
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  dropdown.addEventListener('change', (e) => {
    if (e.target?.type !== 'checkbox') return;
    const colIdx  = parseInt(e.target.dataset.col, 10);
    const visible = e.target.checked;
    const table   = document.getElementById(tableId);
    if (!table) return;

    table.querySelectorAll(`th[data-col="${colIdx}"], td[data-col="${colIdx}"]`).forEach(cell => {
      cell.classList.toggle('col-hidden', !visible);
    });
    // Also update tbody cells by column index
    table.querySelectorAll('tbody tr').forEach(row => {
      const cell = row.cells[colIdx];
      if (cell) cell.classList.toggle('col-hidden', !visible);
    });
  });
}

// ============================================================
// IN-TABLE SEARCH (Live Filter within rendered table)
// ============================================================
function setupInTableSearch(inputId, tbodyId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    Array.from(tbody.rows).forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = !q || text.includes(q) ? '' : 'none';
    });
  });
}

// ============================================================
// SISTEMA UNIVERSAL DE ORDENAMIENTO DE TABLAS
// Permite ordenar cualquier tabla por cualquier columna (Fecha, Piloto, Tienda, Números, %, etc.)
// ============================================================
function setupUniversalTableSorting() {
  document.addEventListener('click', function(e) {
    const th = e.target.closest('table.data-table thead th');
    if (!th) return;

    // Ignorar si tiene la clase no-sort
    if (th.classList.contains('no-sort') || th.getAttribute('data-no-sort') === 'true') {
      return;
    }

    const table = th.closest('table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length <= 1) {
      if (rows[0]?.querySelector('td[colspan]')) return;
    }

    const colIdx = Array.from(th.parentNode.children).indexOf(th);
    if (colIdx < 0) return;

    // Alternar dirección: asc <-> desc
    const isCurrentAsc = th.classList.contains('sort-asc');
    const newDir = isCurrentAsc ? 'desc' : 'asc';

    // Limpiar clases en los demás headers de esta tabla
    table.querySelectorAll('thead th').forEach(h => {
      h.classList.remove('sort-asc', 'sort-desc');
    });
    th.classList.add(newDir === 'asc' ? 'sort-asc' : 'sort-desc');

    table.dataset.sortColIdx = colIdx;
    table.dataset.sortDir = newDir;

    sortTbodyRows(tbody, colIdx, newDir);
  });
}

function sortTbodyRows(tbody, colIdx, dir) {
  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (rows.length <= 1) return;

  const dataRows = [];
  const infoRows = [];
  rows.forEach(r => {
    if (r.querySelector('td[colspan]')) {
      infoRows.push(r);
    } else {
      dataRows.push(r);
    }
  });

  if (dataRows.length === 0) return;

  dataRows.sort((rowA, rowB) => {
    const cellA = rowA.cells[colIdx];
    const cellB = rowB.cells[colIdx];
    const valA = extractCellValueForSort(cellA);
    const valB = extractCellValueForSort(cellB);

    let cmp = 0;
    if (typeof valA === 'number' && typeof valB === 'number') {
      cmp = valA - valB;
    } else {
      cmp = String(valA).localeCompare(String(valB), 'es', { numeric: true, sensitivity: 'base' });
    }
    return dir === 'asc' ? cmp : -cmp;
  });

  const fragment = document.createDocumentFragment();
  dataRows.forEach(r => fragment.appendChild(r));
  infoRows.forEach(r => fragment.appendChild(r));
  tbody.appendChild(fragment);
}

function extractCellValueForSort(td) {
  if (!td) return '';
  if (td.dataset && td.dataset.sort != null) {
    const ds = td.dataset.sort.trim();
    const num = Number(ds);
    return isNaN(num) ? ds.toLowerCase() : num;
  }

  let text = (td.innerText || td.textContent || '').trim();
  if (!text) return -Infinity;

  // 1. Fechas formato ISO (YYYY-MM-DD o YYYY/MM/DD) o formato latino (DD/MM/YYYY)
  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (!isNaN(d.getTime())) return d.getTime();
  }
  const dmyMatch = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // 2. Horas (HH:MM o HH:MM:SS)
  const timeMatch = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    return Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
  }

  // 3. Rangos y medallas (#1, 🥇 #1, #2...)
  const rankMatch = text.match(/#\s*(\d+)/);
  if (rankMatch) {
    return Number(rankMatch[1]);
  }

  // 4. Porcentajes explícitos (ej. 94.5%, 100%)
  const pctMatch = text.match(/([-+]?\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    return Number(pctMatch[1]);
  }

  // 5. Métricas numéricas con sufijo (paqs, paq/h, turnos, cancelaciones)
  const cleanedText = text
    .replace(/[🟢🟡🟠🔴🥇🥈🥉⚡🚨🏪📦🛡️]/g, '')
    .replace(/\b(?:paqs?\/h|paqs?|turnos?|cancelaci[oó]n(?:es)?|horas?|meta)\b/gi, '')
    .replace(/[$]/g, '')
    .replace(/,/g, '')
    .trim();

  const fullNumMatch = cleanedText.match(/^[-+]?\d+(?:\.\d+)?$/);
  if (fullNumMatch) {
    return Number(fullNumMatch[0]);
  }

  // 6. Texto plano (nombres de piloto, tiendas, ciudades, estados)
  return text.toLowerCase();
}

function restoreTableSort(tableOrId) {
  if (!tableOrId) return;
  const table = typeof tableOrId === 'string' ? document.getElementById(tableOrId) : tableOrId;
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  if (table.dataset.sortColIdx != null) {
    const colIdx = Number(table.dataset.sortColIdx);
    const dir = table.dataset.sortDir || 'asc';
    sortTbodyRows(tbody, colIdx, dir);
    const ths = table.querySelectorAll('thead th');
    if (ths[colIdx]) {
      ths.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
      ths[colIdx].classList.add(dir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  }
}

// Re-evalúa y actualiza metas de productividad compuestas y normaliza propiedades operativas
function refreshProductivityMatches(shifts) {
  if (!shifts || !shifts.length) return;
  shifts.forEach(s => {
    // Normalizar evaluable, attended, pilot_cancel y excluded si faltan
    if (s.evaluable === undefined || s.attended === undefined || s.pilot_cancel === undefined) {
      const cls = typeof classifyShiftStatus === 'function' ? classifyShiftStatus(s.status) : null;
      if (cls) {
        if (s.evaluable === undefined) s.evaluable = cls.evaluable;
        if (s.attended === undefined) s.attended = cls.attended;
        if (s.pilot_cancel === undefined) s.pilot_cancel = cls.pilotCancel;
        if (s.excluded === undefined) s.excluded = cls.excluded;
      }
    }

    if (s.target_productivity == null || s.target_productivity === 0 || (s.store && s.store.toUpperCase().includes('BELLO'))) {
      const target = typeof findProductivityTargetExact === 'function' ? findProductivityTargetExact(s.store, s.weekday, s.start) : null;
      if (target != null) {
        s.target_productivity = target;
        s.productivity_eval = typeof evaluateProductivityMatch === 'function' ? evaluateProductivityMatch(s.packages, target) : null;
      }
    }
  });
}

// Inicialización
async function initApp() {
  setupEventListeners();
  setupColumnSelector('mallaCols-btn', 'mallaCols-dropdown', 'tableMallaWrapper');
  setupInTableSearch('mallaTableSearch', 'tableMallaProductividad');
  setupInTableSearch('coberturaTableSearch', 'tableCoverageStores');
  setupInTableSearch('flotaTableSearch', 'tableTop5Store');
  setupInTableSearch('escalafonTableSearch', 'tableTop10Global');
  setupUniversalTableSorting();
  initRiskTableControls();

  // 1. Inicializar base de datos IndexedDB
  try {
    await TaDaDB.open();
    console.log('IndexedDB inicializado correctamente.');

    // Cargar datos locales de IndexedDB si existen
    const cachedMalla = await TaDaDB.getMallaShifts();
    const cachedProg = await TaDaDB.getProgramacionShifts();
    const meta = await TaDaDB.getMeta('last_sync');

    // Detectar caché obsoleto, incompleto o con esquema previo
    const CACHE_VERSION = '2026-10-21-evaluable-v26-clean';
    const cachedVersion = await TaDaDB.getMeta('cache_version');
    const versionMismatch = cachedVersion !== CACHE_VERSION;
    const cachedCities = new Set(cachedMalla.map(r => r.city).filter(Boolean));
    const cacheIsStale = cachedMalla.length > 0 && (cachedCities.size < 4 || cachedMalla.length < 3000 || versionMismatch);

    if (cachedMalla.length > 0 && cachedProg.length > 0 && !cacheIsStale) {
      refreshProductivityMatches(cachedMalla);
      AppState.mallaShifts = cachedMalla;
      AppState.progShifts = cachedProg;
      const effectiveRef = SheetsService.getEffectiveRefDate(cachedMalla);
      AppState.temporal = sanitizeTemporalWindow(SheetsService.getRollingTemporalWindow(effectiveRef));
      updateTemporalBanner();
      updateSyncStatus(`En caché local · Última sincronización: ${new Date(meta?.timestamp || Date.now()).toLocaleTimeString()} (${cachedMalla.length} turnos, ${cachedCities.size} ciudades)`);
      populateFilterOptions();
      loadFiltersFromStorage();
      applyFilters();
    } else {
      if (cacheIsStale) {
        console.warn(`[initApp] Actualizando esquema/caché con metas de Bello y corte a 12 PM (versión ${CACHE_VERSION}). Sincronizando.`);
        await TaDaDB.clearAll?.();
        await TaDaDB.setMeta('cache_version', CACHE_VERSION);
      }
      await triggerLiveSync();
      await TaDaDB.setMeta('cache_version', CACHE_VERSION);
    }
  } catch (err) {
    console.warn('Error accediendo a IndexedDB, usando datos base:', err);
    AppState.mallaShifts = typeof BASE_DATA !== 'undefined' ? BASE_DATA : [];
    refreshProductivityMatches(AppState.mallaShifts);
    const effectiveRef = SheetsService.getEffectiveRefDate(AppState.mallaShifts);
    AppState.temporal = sanitizeTemporalWindow(SheetsService.getRollingTemporalWindow(effectiveRef));
    updateTemporalBanner();
    populateFilterOptions();
    applyFilters();
  }
}

// Sincronización en Tiempo Real con los dos Google Sheets
async function triggerLiveSync() {
  const syncBtn = document.getElementById('btnSyncLive');
  const statusEl = document.getElementById('syncLiveStatus');

  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<span>⏳</span> Sincronizando...`;
  }

  try {
    const result = await SheetsService.syncAll((msg, pct) => {
      if (statusEl) statusEl.innerText = `${msg} (${pct}%)`;
    });

    AppState.mallaShifts = result.mallaShifts;
    AppState.progShifts = result.progShifts;
    AppState.temporal = sanitizeTemporalWindow(result.temporal);

    updateTemporalBanner();
    updateSyncStatus(`En vivo · Sincronizado hace un momento (${AppState.mallaShifts.length + AppState.progShifts.length} turnos)`);
    populateFilterOptions();
    applyFilters();

    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#10b981;">✅ Datos actualizados en tiempo real</span>`;
      setTimeout(() => { statusEl.innerText = ''; }, 3000);
    }
  } catch (err) {
    console.error('Error sincronizando Google Sheets:', err);
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:#ef4444;">❌ Falló sincronización: ${err.message}. Usando caché local.</span>`;
    }
  } finally {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `<span>🔄</span> Sincronizar Ahora`;
    }
  }
}

function updateSyncStatus(text) {
  const el = document.getElementById('lastSyncLabel');
  if (el) el.innerText = text;
}

function updateTemporalBanner() {
  const bannerEl = document.getElementById('temporalBannerText');
  const cuposEl = document.getElementById('temporalCuposAlert');
  if (!AppState.temporal) return;

  const t = AppState.temporal;
  const todayDate = parseDateToNoon(new Date());
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const todayName = dayNames[todayDate.getDay()];
  const todayStr = `${todayName} ${todayDate.getDate()} ${monthNames[todayDate.getMonth()]} ${todayDate.getFullYear()}`;

  // Formatear semana actual de forma legible estrictamente Lunes a Domingo con corte horario de 12:00 PM
  const weekStart = parseDateToNoon(t.currentWeek.startDate);
  const weekEnd = parseDateToNoon(t.currentWeek.endDate);
  const weekLabel = `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} – ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  if (bannerEl) {
    bannerEl.innerHTML = `
      <span>📅 Hoy: <strong>${todayStr}</strong></span> ·
      <span class="temporal-badge">📆 Sem ${t.currentWeek.weekNumber} &middot; ${weekLabel}</span> ·
      <span style="color: var(--text-muted); font-size: 0.78rem;">Ventana Rodante: <strong style="color:#fff;">${t.windowStart} al ${t.windowEnd}</strong> (3 semanas)</span>
    `;
  }

  // Contabilizar cupos faltantes en la semana actual evaluando con corte horario de 12:00 PM
  const currentWeekVacant = AppState.progShifts.filter(s => {
    return s.is_vacant && isDateInRangeWithNoonCut(s.date, t.currentWeek.startDate, t.currentWeek.endDate);
  }).length;

  if (cuposEl) {
    if (currentWeekVacant > 0) {
      cuposEl.className = 'pulse-chip alert-chip';
      cuposEl.innerHTML = `
        <span class="pulse-label">Vacantes Sem:</span>
        <strong class="pulse-val" id="execHealthVacantVal" style="color:#f87171;">🚨 ${currentWeekVacant}</strong>
      `;
    } else if (AppState.progShifts.length > 0) {
      cuposEl.className = 'pulse-chip status-chip';
      cuposEl.innerHTML = `<span class="pulse-label">Vacantes Sem:</span> <strong class="pulse-val" id="execHealthVacantVal" style="color:#10b981;">✅ 0</strong>`;
    } else {
      cuposEl.className = 'pulse-chip';
      cuposEl.innerHTML = `<span class="pulse-label">Vacantes Sem:</span> <strong class="pulse-val" id="execHealthVacantVal">—</strong>`;
    }
  }

  // Actualizar Franja Ejecutiva de Salud Operativa
  updateExecutiveHealthStrip();
}

// ============================================================
// FRANJA EJECUTIVA DE SALUD OPERATIVA (EXECUTIVE HEALTH STRIP)
// ============================================================
function updateExecutiveHealthStrip(kpis) {
  if (!kpis) {
    if (!AppState.filteredMalla || AppState.filteredMalla.length === 0) return;
    kpis = calculateModulo1Kpis(AppState.filteredMalla, APP_CONFIG);
  }

  const statusEl = document.getElementById('execHealthStatusText');
  const dotEl = document.querySelector('#execHealthStatus .status-indicator-dot');

  const assistValEl = document.getElementById('execHealthAssistVal');
  const covValEl = document.getElementById('execHealthCoverageVal');
  const punctValEl = document.getElementById('execHealthPunctualityVal');
  const cancelValEl = document.getElementById('execHealthCancelVal');
  const vacantValEl = document.getElementById('execHealthVacantVal');

  if (assistValEl) assistValEl.innerText = fmtPct(kpis.asistenciaEffectivenessPct);
  if (covValEl) covValEl.innerText = fmtPct(kpis.cuposCoveragePct);
  if (punctValEl) punctValEl.innerText = fmtPct(kpis.punctualityPct);
  if (cancelValEl) cancelValEl.innerText = fmtPct(kpis.cancellationRatePct);

  // Vacantes en semana actual
  const currentWeekVacant = (AppState.progShifts || []).filter(s => {
    return s.is_vacant && AppState.temporal?.currentWeek && isDateInRangeWithNoonCut(s.date, AppState.temporal.currentWeek.startDate, AppState.temporal.currentWeek.endDate);
  }).length;

  if (vacantValEl) {
    const totalVac = currentWeekVacant > 0 ? currentWeekVacant : kpis.cuposFaltantesTotal;
    vacantValEl.innerText = `${totalVac} cupo${totalVac !== 1 ? 's' : ''}`;
    vacantValEl.style.color = totalVac > 0 ? '#f87171' : '#34d399';
  }

  // Diagnóstico Global
  const eff = kpis.asistenciaEffectivenessPct ?? 0;
  const can = kpis.cancellationRatePct ?? 0;
  const punc = kpis.punctualityPct ?? 0;

  const isOptimal = (eff >= 95) && (can <= 5) && (punc >= 90) && (kpis.cuposFaltantesTotal === 0);
  const isCritical = (eff < 90) || (can > 10) || (kpis.cuposFaltantesTotal > 15);

  if (isOptimal) {
    if (statusEl) statusEl.innerText = 'Operación Saludable y en Meta';
    if (dotEl) dotEl.className = 'status-indicator-dot green';
  } else if (isCritical) {
    if (statusEl) statusEl.innerText = 'Alerta Operativa · Atención Requerida';
    if (dotEl) dotEl.className = 'status-indicator-dot red';
  } else {
    if (statusEl) statusEl.innerText = 'Operación en Observación';
    if (dotEl) dotEl.className = 'status-indicator-dot yellow';
  }
}

// ============================================================
// CONTADORES DINÁMICOS DE PESTAÑAS (TAB BADGES)
// ============================================================
function updateTabBadges() {
  const badgeCov = document.getElementById('tabBadgeCoverage');
  const badgeCrit = document.getElementById('tabBadgeCritical');

  if (badgeCov && AppState.coverageAnalysis) {
    const vacantCount = AppState.coverageAnalysis.totalVacant || 0;
    if (vacantCount > 0) {
      badgeCov.innerText = `${vacantCount} Vacante${vacantCount > 1 ? 's' : ''}`;
      badgeCov.className = 'tab-badge tab-badge-alert';
    } else {
      badgeCov.innerText = '100% OK';
      badgeCov.className = 'tab-badge pill-good';
    }
  }

  if (badgeCrit && AppState.filteredMalla) {
    const fleetRanking = typeof RankingFlotaCriticaEngine !== 'undefined'
      ? RankingFlotaCriticaEngine.getGlobalTop10Cancels(AppState.filteredMalla)
      : [];
    const highRiskCount = fleetRanking.filter(p => p.cancels >= 2 || p.riskScore >= 60).length;
    if (highRiskCount > 0) {
      badgeCrit.innerText = `${highRiskCount} Crítico${highRiskCount > 1 ? 's' : ''}`;
      badgeCrit.className = 'tab-badge tab-badge-alert';
    } else {
      badgeCrit.innerText = 'Bajo Riesgo';
      badgeCrit.className = 'tab-badge pill-good';
    }
  }
}

// Configurar escuchadores de eventos y selectores híbridos/múltiples
function setupEventListeners() {
  // Tabs de navegación de módulos
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Filtros estándar de texto y selección simple
  ['filterCity', 'filterStore', 'filterPilot', 'filterDemand'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => applyFilters());
      el.addEventListener('change', () => applyFilters());
    }
  });

  // Selector de Fechas Híbrido (DatePicker visual + Ingreso manual DD/MM/AAAA o AAAA-MM-DD)
  setupHybridDatePickers();

  // Nuevos Filtros Multiselect
  setupMultiSelects();

  const citySelect = document.getElementById('filterCity');
  if (citySelect) {
    citySelect.addEventListener('change', () => {
      const c = citySelect.value;
      const stores = [...new Set(AppState.mallaShifts.filter(r => !c || r.city === c).map(r => r.store).filter(Boolean))].sort();
      updateSelectOptions('filterStore', stores, 'Todos los puntos');
    });
  }

  // Botones header
  document.getElementById('btnSyncLive')?.addEventListener('click', triggerLiveSync);
  document.getElementById('btnClearCacheSync')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnClearCacheSync');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳</span> Limpiando...`;
    }
    try {
      await TaDaDB.clearAll?.();
      await triggerLiveSync();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>🧹</span> Limpiar Caché`;
      }
    }
  });
  document.getElementById('btnResetFilters')?.addEventListener('click', resetFilters);
  document.getElementById('btnOpenConfig')?.addEventListener('click', openConfigModal);
  document.getElementById('btnExportCsv')?.addEventListener('click', exportToCsv);
  document.getElementById('btnPrintPdf')?.addEventListener('click', () => window.print());

  // Exportadores por módulo
  document.getElementById('btnExportProductividad')?.addEventListener('click', exportProductividadCsv);
  document.getElementById('btnExportCobertura')?.addEventListener('click', exportCoberturaCsv);
  document.getElementById('btnExportAuditoriaStore')?.addEventListener('click', exportAuditoriaTiendaCsv);

  // Listeners del Módulo de Flota Crítica
  document.getElementById('rankingStoreSelect')?.addEventListener('change', (e) => {
    AppState.selectedRankingStore = e.target.value;
    renderTop5StoreTable();
  });
  document.getElementById('btnExportCriticalRanking')?.addEventListener('click', exportCriticalRankingCsv);
  document.getElementById('btnExportEscalafonGlobal')?.addEventListener('click', exportEscalafonGlobalCsv);

  // Selector rápido de Semana Operativa (Estrictamente Lunes a Domingo, 7 días exactos con corte a las 12:00 PM)
  document.getElementById('filterSemana')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const fromInput = document.getElementById('filterFrom');
    const toInput = document.getElementById('filterTo');
    const fromPicker = document.getElementById('filterFromPicker');
    const toPicker = document.getElementById('filterToPicker');

    if (!val) {
      if (fromInput) fromInput.value = '';
      if (toInput) toInput.value = '';
      if (fromPicker) fromPicker.value = '';
      if (toPicker) toPicker.value = '';
    } else if (val.startsWith('last')) {
      const weeksCount = parseInt(val.replace('last', ''), 10) || 4;
      const refDate = SheetsService.getEffectiveRefDate(AppState.mallaShifts);
      const today = parseDateToNoon(refDate);
      // Calcular el lunes de la semana actual a las 12:00 PM
      const dayNum = today.getDay() || 7;
      const mon = new Date(today);
      mon.setDate(today.getDate() - (dayNum - 1));
      mon.setHours(12, 0, 0, 0);

      // Calcular el lunes inicial de hace N semanas a las 12:00 PM
      const pastMon = new Date(mon);
      pastMon.setDate(mon.getDate() - ((weeksCount - 1) * 7));
      pastMon.setHours(12, 0, 0, 0);

      // Calcular el domingo actual (+6 días exactos) a las 12:00 PM
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      sun.setHours(12, 0, 0, 0);

      const fromIso = formatDateToNoonIso(pastMon);
      const toIso = formatDateToNoonIso(sun);

      if (fromInput) fromInput.value = fromIso;
      if (toInput) toInput.value = toIso;
      if (fromPicker) fromPicker.value = fromIso;
      if (toPicker) toPicker.value = toIso;
    } else {
      const parts = val.split(':');
      if (parts.length === 2) {
        if (fromInput) fromInput.value = parts[0];
        if (toInput) toInput.value = parts[1];
        if (fromPicker) fromPicker.value = parts[0];
        if (toPicker) toPicker.value = parts[1];
      }
    }
    applyFilters();
  });

  // Selector de semana en Módulo 3
  document.getElementById('modulo3WeekSelect')?.addEventListener('change', (e) => {
    AppState.selectedModulo3Week = e.target.value;
    renderModulo3Visuals();
  });

  // Modal Configuración
  setupConfigModal();

  // Modal Suplentes
  setupSuplentesModal();

  // Buscador de piloto en Ficha 360°
  document.getElementById('profileSearchInput')?.addEventListener('input', (e) => {
    handlePilotSearchTypeahead(e.target.value);
  });
}

/**
 * Configura los DatePickers Híbridos para interactuar mediante calendario visual o texto manual
 */
function setupHybridDatePickers() {
  const fromText = document.getElementById('filterFrom');
  const fromPicker = document.getElementById('filterFromPicker');
  const btnFrom = document.getElementById('btnPickerFrom');

  const toText = document.getElementById('filterTo');
  const toPicker = document.getElementById('filterToPicker');
  const btnTo = document.getElementById('btnPickerTo');

  btnFrom?.addEventListener('click', () => {
    try {
      if (fromPicker && fromPicker.showPicker) fromPicker.showPicker();
      else fromPicker?.focus();
    } catch {
      fromPicker?.focus();
    }
  });

  btnTo?.addEventListener('click', () => {
    try {
      if (toPicker && toPicker.showPicker) toPicker.showPicker();
      else toPicker?.focus();
    } catch {
      toPicker?.focus();
    }
  });

  fromPicker?.addEventListener('change', () => {
    if (fromText) fromText.value = fromPicker.value;
    applyFilters();
  });

  toPicker?.addEventListener('change', () => {
    if (toText) toText.value = toPicker.value;
    applyFilters();
  });

  fromText?.addEventListener('input', () => {
    const iso = parseHybridDate(fromText.value);
    if (iso && fromPicker) fromPicker.value = iso;
    applyFilters();
  });

  toText?.addEventListener('input', () => {
    const iso = parseHybridDate(toText.value);
    if (iso && toPicker) toPicker.value = iso;
    applyFilters();
  });
}

/**
 * Inicializa los 3 multiselects: Día de la Semana, Inicio de Turno y Estado de Tabla
 */
function setupMultiSelects() {
  const diasSemanales = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  multiSelectDia = new CustomMultiSelect({
    containerId: 'filterDiaMulti',
    options: diasSemanales,
    placeholder: 'Todos los días',
    onChange: (selected) => {
      AppState.selectedDays = selected;
      applyFilters();
    }
  });

  multiSelectInicio = new CustomMultiSelect({
    containerId: 'filterInicioMulti',
    options: [],
    placeholder: 'Todos los inicios',
    onChange: (selected) => {
      AppState.selectedStartTimes = selected;
      applyFilters();
    }
  });

  multiSelectEstado = new CustomMultiSelect({
    containerId: 'filterEstadoMulti',
    options: [],
    placeholder: 'Por defecto (activos)',
    onChange: (selected) => {
      AppState.selectedStatuses = selected;
      renderMallaProductivityTable();
    }
  });
}

function switchTab(tabId) {
  AppState.activeTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    c.style.display = c.id === `tab-${tabId}` ? 'block' : 'none';
  });

  // Si el usuario estaba desplazado abajo en una tabla o reporte, regresar al inicio de forma fluida
  const shell = document.getElementById('stickyNavigationShell');
  const shellHeight = shell ? shell.offsetHeight : 120;
  if (window.scrollY > shellHeight) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Si entra al Módulo de Flota Crítica, refrescar rankings
  if (tabId === 'flota-critica') {
    renderFlotaCriticaModule();
  }

  // Si entra al Módulo 3 (Analítica de Semanas), inicializar gráficos y tendencias
  if (tabId === 'metricas') {
    setTimeout(() => {
      renderModulo3Visuals();
    }, 50);
  }

  // Si entra al Módulo 2 (Cobertura Preventiva), refrescar análisis
  if (tabId === 'cobertura') {
    renderModulo2Coverage();
  }

  // Si entra a la Ficha de Piloto y no hay seleccionado, tomar el primero
  if (tabId === 'pilotos' && !AppState.selectedPilot && AppState.pilotsList.length > 0) {
    selectPilotForProfile(AppState.pilotsList[0].pilot);
  }
}

/**
 * Calcula todas las semanas operativas (ISO) presentes en el dataset
 * Anclado estrictamente a las 12:00 PM (mediodía) para cerrar de Lunes a Domingo (7 días exactos)
 */
function computeAvailableWeeks(shifts) {
  const weekMap = {};
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  shifts.forEach(s => {
    if (!s.date || s.date.length < 10) return;
    const dNoon = parseDateToNoon(s.date);
    if (!dNoon) return;

    // Cálculo ISO de número de semana anclado a las 12:00 PM UTC
    const d = new Date(Date.UTC(dNoon.getFullYear(), dNoon.getMonth(), dNoon.getDate(), 12, 0, 0));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Jueves 12:00 UTC
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1, 12, 0, 0));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    const weekYear = d.getUTCFullYear();
    const weekKey = `${weekYear}-W${String(weekNo).padStart(2, '0')}`;

    if (!weekMap[weekKey]) {
      const mon = new Date(d);
      mon.setUTCDate(d.getUTCDate() - 3); // Lunes 12:00 UTC
      const sun = new Date(mon);
      sun.setUTCDate(mon.getUTCDate() + 6); // Domingo 12:00 UTC (+6 días exactos)

      const monIso = `${mon.getUTCFullYear()}-${String(mon.getUTCMonth() + 1).padStart(2, '0')}-${String(mon.getUTCDate()).padStart(2, '0')}`;
      const sunIso = `${sun.getUTCFullYear()}-${String(sun.getUTCMonth() + 1).padStart(2, '0')}-${String(sun.getUTCDate()).padStart(2, '0')}`;

      const monLabel = `${mon.getUTCDate()} ${monthNames[mon.getUTCMonth()]}`;
      const sunLabel = `${sun.getUTCDate()} ${monthNames[sun.getUTCMonth()]}`;

      weekMap[weekKey] = {
        weekKey,
        weekNumber: weekNo,
        year: weekYear,
        startDate: monIso,
        endDate: sunIso,
        label: `Semana ${weekNo} (${monLabel} – ${sunLabel})`,
        count: 0
      };
    }
    weekMap[weekKey].count++;
  });

  return Object.values(weekMap).sort((a, b) => b.weekKey.localeCompare(a.weekKey));
}

function populateFilterOptions() {
  const cities = [...new Set(AppState.mallaShifts.map(r => r.city).filter(Boolean))].sort();
  updateSelectOptions('filterCity', cities, 'Todas las ciudades');

  const stores = [...new Set(AppState.mallaShifts.map(r => r.store).filter(Boolean))].sort();
  updateSelectOptions('filterStore', stores, 'Todos los puntos');

  // Calcular y almacenar semanas disponibles combinando Malla histórica y Programación activa (estrictamente Lunes a Domingo)
  const allShiftsForWeeks = [...AppState.mallaShifts, ...AppState.progShifts];
  AppState.availableWeeks = computeAvailableWeeks(allShiftsForWeeks);

  // Asegurar que la ventana temporal esté debidamente sanitizada y la semana actual (calculada con corte de 12 PM) siempre presente
  AppState.temporal = sanitizeTemporalWindow(AppState.temporal);
  if (AppState.temporal?.currentWeek) {
    const curW = AppState.temporal.currentWeek;
    const exists = AppState.availableWeeks.some(w => w.startDate === curW.startDate && w.endDate === curW.endDate);
    if (!exists) {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const mDate = parseDateToNoon(curW.startDate);
      const sDate = parseDateToNoon(curW.endDate);
      const curLabel = `Semana ${curW.weekNumber} (${mDate.getDate()} ${monthNames[mDate.getMonth()]} – ${sDate.getDate()} ${monthNames[sDate.getMonth()]})`;
      AppState.availableWeeks.unshift({
        weekKey: `2026-W${String(curW.weekNumber).padStart(2, '0')}`,
        weekNumber: curW.weekNumber,
        year: sDate.getFullYear(),
        startDate: curW.startDate,
        endDate: curW.endDate,
        label: curLabel,
        count: allShiftsForWeeks.filter(s => isDateInRangeWithNoonCut(s.date, curW.startDate, curW.endDate)).length
      });
      AppState.availableWeeks.sort((a, b) => b.weekKey.localeCompare(a.weekKey));
    }
  }

  // Poblar selector de semana en filtros globales
  const semanaSelect = document.getElementById('filterSemana');
  if (semanaSelect) {
    const curVal = semanaSelect.value;
    const curW = AppState.temporal?.currentWeek;
    let html = `<option value="">Todo el Histórico (Todas las semanas)</option>`;
    if (curW) {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const mD = parseDateToNoon(curW.startDate);
      const sD = parseDateToNoon(curW.endDate);
      const curRangeLabel = `${mD.getDate()} ${monthNames[mD.getMonth()]} al ${sD.getDate()} ${monthNames[sD.getMonth()]} ${sD.getFullYear()}`;
      html += `<option value="${curW.startDate}:${curW.endDate}">⭐ Semana Actual: Sem ${curW.weekNumber} (${curRangeLabel})</option>`;
    }
    html += `<option value="last4">Últimas 4 Semanas (Lunes a Domingo)</option>`;
    html += `<option value="last8">Últimas 8 Semanas (Lunes a Domingo)</option>`;
    html += `<option value="last12">Últimas 12 Semanas (Lunes a Domingo)</option>`;
    AppState.availableWeeks.forEach(w => {
      if (curW && w.startDate === curW.startDate && w.endDate === curW.endDate) return;
      html += `<option value="${w.startDate}:${w.endDate}">${w.label} &middot; (${w.count} turnos)</option>`;
    });
    semanaSelect.innerHTML = html;
    if (curVal) semanaSelect.value = curVal;
  }

  // Poblar selector de semana en Módulo 3
  const modulo3Select = document.getElementById('modulo3WeekSelect');
  if (modulo3Select) {
    let html = '';
    AppState.availableWeeks.forEach(w => {
      html += `<option value="${w.weekKey}">${w.label} &middot; (${w.count} turnos)</option>`;
    });
    modulo3Select.innerHTML = html;
    if (AppState.selectedModulo3Week) modulo3Select.value = AppState.selectedModulo3Week;
  }

  // Poblar Multiselect de Inicio de Turno con las horas reales presentes en los turnos
  const startTimes = [...new Set(AppState.mallaShifts.map(s => fmtMinutes(s.start)).filter(t => t && t !== '—'))].sort();
  multiSelectInicio?.setOptions(startTimes);

  // Poblar Multiselect de Estados para la Tabla de Productividad
  const allStatuses = [...new Set(AppState.mallaShifts.map(s => s.status && String(s.status).trim()).filter(Boolean))].sort();
  multiSelectEstado?.setOptions(allStatuses);
}

function updateSelectOptions(elementId, items, defaultLabel) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const current = el.value;
  let html = `<option value="">${defaultLabel}</option>`;
  items.forEach(item => {
    html += `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`;
  });
  el.innerHTML = html;
  if (items.includes(current)) el.value = current;
}

// Aplicar filtros globales evaluando cada fecha con corte horario de 12:00 PM
function applyFilters() {
  // Mostrar skeleton mientras se filtra
  showSkeletonKpis();

  const city = document.getElementById('filterCity')?.value || '';
  const store = document.getElementById('filterStore')?.value || '';
  const fromRaw = document.getElementById('filterFrom')?.value || '';
  const toRaw = document.getElementById('filterTo')?.value || '';
  const fromIso = parseHybridDate(fromRaw);
  const toIso = parseHybridDate(toRaw);
  const pilotQuery = (document.getElementById('filterPilot')?.value || '').trim().toLowerCase();
  const demand = document.getElementById('filterDemand')?.value || '';

  // Filtrar Malla (Sheet 1) con validación horaria de 12:00 PM por día puntual
  AppState.filteredMalla = AppState.mallaShifts.filter(r => {
    if (city && r.city !== city) return false;
    if (store && r.store !== store) return false;
    if ((fromIso || toIso) && !isDateInRangeWithNoonCut(r.date, fromIso, toIso)) return false;
    if (pilotQuery) {
      const matchP = (r.pilot || '').toLowerCase().includes(pilotQuery);
      const matchId = (r.pilot_id || '').toLowerCase().includes(pilotQuery);
      if (!matchP && !matchId) return false;
    }
    if (demand === 'low' && !r.low_demand) return false;
    if (demand === 'normal' && r.low_demand) return false;

    // Filtro por Día de la Semana (Multiselect)
    if (AppState.selectedDays && AppState.selectedDays.length > 0) {
      const rDay = normalizeKeyStr(r.weekday || '');
      const dayMatches = AppState.selectedDays.some(d => normalizeKeyStr(d) === rDay);
      if (!dayMatches) return false;
    }

    // Filtro por Rango de Inicio de Turno (Multiselect)
    if (AppState.selectedStartTimes && AppState.selectedStartTimes.length > 0) {
      const rTimeStr = fmtMinutes(r.start);
      if (!AppState.selectedStartTimes.includes(rTimeStr)) return false;
    }

    return true;
  });

  // Filtrar Programación (Sheet 2) con validación horaria de 12:00 PM por día puntual
  AppState.filteredProg = AppState.progShifts.filter(s => {
    if (city && s.city !== city) return false;
    if (store && s.store !== store) return false;
    if ((fromIso || toIso) && !isDateInRangeWithNoonCut(s.date, fromIso, toIso)) return false;
    if (pilotQuery && !s.is_vacant) {
      const matchP = (s.pilot || '').toLowerCase().includes(pilotQuery);
      const matchId = (s.pilot_id || '').toLowerCase().includes(pilotQuery);
      if (!matchP && !matchId) return false;
    }
    if (AppState.selectedDays && AppState.selectedDays.length > 0) {
      const sDay = normalizeKeyStr(s.weekday || '');
      const dayMatches = AppState.selectedDays.some(d => normalizeKeyStr(d) === sDay);
      if (!dayMatches) return false;
    }
    if (AppState.selectedStartTimes && AppState.selectedStartTimes.length > 0) {
      const sTimeStr = fmtMinutes(s.start);
      if (!AppState.selectedStartTimes.includes(sTimeStr)) return false;
    }
    return true;
  });

  // Generar lista de pilotos agregados
  generatePilotsList();

  // Guardar y mostrar filtros activos
  saveFiltersToStorage();
  updateActiveFiltersBadges();

  // Renderizar vistas
  renderKpis();
  renderMallaProductivityTable();
  renderModulo2Coverage();
  renderFlotaCriticaModule();

  if (AppState.activeTab === 'metricas') {
    renderModulo3Visuals();
  }
  if (AppState.selectedPilot) {
    selectPilotForProfile(AppState.selectedPilot.pilot);
  }
}

function resetFilters() {
  if (document.getElementById('filterFrom')) document.getElementById('filterFrom').value = '';
  if (document.getElementById('filterTo')) document.getElementById('filterTo').value = '';
  if (document.getElementById('filterFromPicker')) document.getElementById('filterFromPicker').value = '';
  if (document.getElementById('filterToPicker')) document.getElementById('filterToPicker').value = '';
  if (document.getElementById('filterSemana')) document.getElementById('filterSemana').value = '';
  if (document.getElementById('filterCity')) document.getElementById('filterCity').value = '';
  if (document.getElementById('filterStore')) document.getElementById('filterStore').value = '';
  if (document.getElementById('filterPilot')) document.getElementById('filterPilot').value = '';
  if (document.getElementById('filterDemand')) document.getElementById('filterDemand').value = '';
  // Clear in-table searches
  ['mallaTableSearch','coberturaTableSearch','flotaTableSearch'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  AppState.selectedDays = [];
  AppState.selectedStartTimes = [];
  AppState.selectedStatuses = [];
  AppState.mallaPage = 1;
  multiSelectDia?.clear();
  multiSelectInicio?.clear();
  multiSelectEstado?.clear();
  try { localStorage.removeItem(FILTER_STORAGE_KEY); } catch(e) {}
  applyFilters();
}

function generatePilotsList() {
  // Usar la base histórica completa (AppState.mallaShifts) para preservar la trazabilidad
  // y evitar que los pilotos desaparezcan al filtrar por tienda o semana en el encabezado
  const sourceShifts = (AppState.mallaShifts && AppState.mallaShifts.length > 0)
    ? AppState.mallaShifts
    : (AppState.filteredMalla || []);

  const pilotMap = {};
  sourceShifts.forEach(r => {
    const pName = (r.pilot || '').trim();
    if (!pName || pName === '—' || pName.toLowerCase() === 'sin piloto') return;
    if (!pilotMap[pName]) pilotMap[pName] = [];
    pilotMap[pName].push(r);
  });

  // Conjunto de turnos actualmente filtrados por los controles globales del encabezado
  const filteredSet = new Set(AppState.filteredMalla || []);

  AppState.pilotsList = Object.entries(pilotMap).map(([pilot, shifts]) => {
    // Normalizar propiedades operativas en cada turno antes del cálculo de métricas
    shifts.forEach(s => {
      if (s.evaluable === undefined || s.attended === undefined || s.pilot_cancel === undefined) {
        const cls = typeof classifyShiftStatus === 'function' ? classifyShiftStatus(s.status) : null;
        if (cls) {
          if (s.evaluable === undefined) s.evaluable = cls.evaluable;
          if (s.attended === undefined) s.attended = cls.attended;
          if (s.pilot_cancel === undefined) s.pilot_cancel = cls.pilotCancel;
          if (s.excluded === undefined) s.excluded = cls.excluded;
        }
      }
    });

    // Turnos de este piloto en el periodo activo filtrado
    const periodShifts = shifts.filter(s => filteredSet.has(s));

    // Métricas históricas completas (trazabilidad)
    const metrics = aggregateShiftMetrics(shifts, APP_CONFIG);
    const reliability = calculateReliabilityScore(metrics, APP_CONFIG);

    // Métricas del periodo filtrado (si tiene turnos en la semana consultada)
    const periodMetrics = periodShifts.length > 0 ? aggregateShiftMetrics(periodShifts, APP_CONFIG) : null;

    const first = shifts[0] || {};
    return {
      pilot,
      pilot_id: first.pilot_id || '—',
      phone: first.phone || '—',
      city: first.city || '—',
      mainStore: first.store || '—',
      shifts,
      periodShifts,
      metrics,
      periodMetrics,
      reliability,
      recommendation: reliability
    };
  }).sort((a, b) => (b.reliability.score ?? -1) - (a.reliability.score ?? -1));
}

// ============================================================
// REESTRUCTURACIÓN DE TARJETAS KPI (EXCLUSIVAS DEL MÓDULO 1)
// 9 Tarjetas Oficiales Recalibradas con Regla de Match Transversal
// Micro-Barras de Progreso, Metas Comparativas y Tooltips
// ============================================================
function renderKpis() {
  const container = document.getElementById('kpisContainer');
  if (!container) return;

  const kpis = calculateModulo1Kpis(AppState.filteredMalla, APP_CONFIG);
  updateExecutiveHealthStrip(kpis);
  updateTabBadges();

  const effPct = kpis.asistenciaEffectivenessPct ?? 0;
  const canPct = kpis.cancellationRatePct ?? 0;
  const covPct = kpis.cuposCoveragePct ?? 0;
  const puncPct = kpis.punctualityPct ?? 0;

  const effColor = kpis.asistenciaEffectivenessPct == null ? ''
    : effPct >= (APP_CONFIG.attendanceGreen || 95) ? 'kpi-emerald'
    : effPct >= (APP_CONFIG.attendanceYellow || 90) ? 'kpi-amber' : 'kpi-rose';

  const canColor = kpis.cancellationRatePct == null ? ''
    : canPct <= (APP_CONFIG.cancellationGreen || 5) ? 'kpi-emerald'
    : canPct <= (APP_CONFIG.cancellationYellow || 10) ? 'kpi-amber' : 'kpi-rose';

  const covColor = kpis.cuposCoveragePct == null ? ''
    : covPct >= 95 ? 'kpi-emerald'
    : covPct >= 85 ? 'kpi-amber' : 'kpi-rose';

  const vacColor = kpis.cuposFaltantesTotal > 0 ? 'kpi-rose' : 'kpi-emerald';

  const puncColor = kpis.punctualityPct == null ? ''
    : puncPct >= (APP_CONFIG.punctualityGreen || 90) ? 'kpi-emerald'
    : puncPct >= (APP_CONFIG.punctualityYellow || 80) ? 'kpi-amber' : 'kpi-rose';

  const attScaleColor = kpis.avgAttendanceScale7 >= 6.5 ? 'kpi-emerald'
    : kpis.avgAttendanceScale7 >= 5.5 ? 'kpi-amber' : 'kpi-rose';

  const cards = [
    {
      label: '1. Efectividad de Asistencia',
      isHero: true,
      heroTag: 'Pilar Directivo',
      value: fmtPct(kpis.asistenciaEffectivenessPct),
      sub: `${kpis.asistenciaCoveredCount} cubiertos de ${kpis.asistenciaRequiredCount} requeridos (Match transversal)`,
      icon: '🛡️',
      colorClass: effColor,
      target: `Meta: ≥${APP_CONFIG.attendanceGreen || 95}%`,
      targetClass: effPct >= (APP_CONFIG.attendanceGreen || 95) ? 'target-good' : (effPct >= 90 ? 'target-warn' : 'target-bad'),
      progressPct: Math.min(100, Math.max(0, effPct)),
      tooltip: 'Proporción de turnos requeridos que fueron cubiertos efectivamente por el titular o suplente compensado (Match Transversal).'
    },
    {
      label: '2. Tasa de Cancelación',
      value: fmtPct(kpis.cancellationRatePct),
      sub: (() => {
        const raw = kpis.cuposFaltantesBreakdown?.rawCancels ?? kpis.penalizedBreakdown?.totalCancels ?? kpis.penalizedBreakdown?.pilotCancel ?? 0;
        const matched = kpis.cuposFaltantesBreakdown?.matchedReplacements || 0;
        const unmatched = kpis.cuposFaltantesBreakdown?.unmatchedCancels || 0;
        const pCancels = kpis.cuposFaltantesBreakdown?.pilotCancels ?? kpis.penalizedBreakdown?.pilotCancel ?? 0;
        const cCancels = kpis.cuposFaltantesBreakdown?.clientCancels ?? kpis.penalizedBreakdown?.clientCancel ?? 0;

        if (cCancels > 0) {
          return `${raw} cancelados (${pCancels} piloto, ${cCancels} cliente · ${matched} cubiertos · ${unmatched} sin reemplazo)`;
        }
        return `${raw} cancelados (${matched} cubiertos con reemplazo · ${unmatched} sin reemplazo)`;
      })(),
      icon: '🚫',
      colorClass: canColor,
      target: `Tolerancia: ≤${APP_CONFIG.cancellationGreen || 5}%`,
      targetClass: canPct <= (APP_CONFIG.cancellationGreen || 5) ? 'target-good' : (canPct <= 10 ? 'target-warn' : 'target-bad'),
      progressPct: Math.min(100, Math.max(0, 100 - (canPct * 5))),
      tooltip: 'Porcentaje de turnos cancelados (Piloto Cancela + Cliente Cancela) sobre turnos requeridos. Valida transversalmente que todo registro de cancelación tenga su correspondiente match con reemplazo en la misma fecha, tienda y horario.'
    },
    {
      label: '3. Cobertura de Cupos',
      isHero: true,
      heroTag: 'Meta Operativa',
      value: fmtPct(kpis.cuposCoveragePct),
      sub: `${fmtNum(kpis.cuposCoveredCount, 0)} numerador ÷ ${fmtNum(kpis.cuposEvaluatedCount, 0)} denominador`,
      icon: '🎯',
      colorClass: covColor,
      target: 'Meta: ≥95%',
      targetClass: covPct >= 95 ? 'target-good' : (covPct >= 85 ? 'target-warn' : 'target-bad'),
      progressPct: Math.min(100, Math.max(0, covPct > 100 ? 100 : covPct)),
      tooltip: 'Cobertura de Cupos (%) = (Suma estados numerador [Confirmados, Reemplazo, Adic TaDa, Adic autorizados, Piloto Cancela, Cliente Cancela, Adic Cancela, Tienda cerrada] ÷ Suma estados denominador [Confirmados, Reemplazo, Adic TaDa, Adic autorizados, Tienda cerrada]) × 100. Adicional no autorizado completamente excluido.'
    },
    {
      label: '4. Cupos Faltantes (Vacantes)',
      value: fmtNum(kpis.cuposFaltantesTotal, 0),
      sub: `${kpis.cuposFaltantesBreakdown.unmatchedCancels} cancelados sin reemplazo · ${kpis.cuposFaltantesBreakdown.noProgramado} no prog · ${kpis.cuposFaltantesBreakdown.sinPiloto} sin piloto`,
      icon: '⚠️',
      colorClass: vacColor,
      target: 'Objetivo: 0 vacantes',
      targetClass: kpis.cuposFaltantesTotal === 0 ? 'target-good' : 'target-bad',
      progressPct: kpis.cuposFaltantesTotal === 0 ? 100 : Math.max(8, 100 - (kpis.cuposFaltantesTotal * 8)),
      tooltip: 'Turnos requeridos que quedaron descubiertos (cancelados sin reemplazo, sin piloto o no programados). Requieren activación de suplentes.'
    },
    {
      label: '5. Puntualidad de Llegada',
      value: fmtPct(kpis.punctualityPct),
      sub: `Gabela 09:00 hasta 10:15 / +30min · ${kpis.punctualCount} de ${kpis.punctualityEvaluatedCount} evaluados`,
      icon: '⏱️',
      colorClass: puncColor,
      target: `Meta: ≥${APP_CONFIG.punctualityGreen || 90}%`,
      targetClass: puncPct >= (APP_CONFIG.punctualityGreen || 90) ? 'target-good' : (puncPct >= 80 ? 'target-warn' : 'target-bad'),
      progressPct: Math.min(100, Math.max(0, puncPct)),
      tooltip: 'Porcentaje de conductores que registraron llegada dentro de la gabela oficial (09:00 hasta 10:15 / margen de gracia de +30 min).'
    },
    {
      label: '6. Pilotos Activos',
      value: fmtNum(kpis.activePilotsCount, 0),
      sub: `${fmtNum(kpis.activePilotsCount, 0)} conductores únicos con turno en el período`,
      icon: '🛵',
      colorClass: 'kpi-blue',
      target: 'Universo Único',
      targetClass: 'target-info',
      progressPct: 100,
      tooltip: 'Cantidad de conductores únicos (por ID/Cédula) con al menos un turno programado en el rango de fechas seleccionado. Si un mismo ID aparece en múltiples fechas, turnos o tiendas, se contabiliza exactamente una sola vez.'
    },
    {
      label: '7. Paquetes Entregados',
      value: fmtNum(kpis.totalPackages, 0),
      sub: `Horas gestionadas: ${fmtNum(kpis.validManagedShiftsCount, 0)} turnos × 8h = ${fmtNum(kpis.totalManagedHours, 0)}h`,
      icon: '📦',
      colorClass: 'kpi-purple',
      target: 'Meta: ≥1.5 paq/h',
      targetClass: kpis.fleetProductivityPaqH >= 1.5 ? 'target-good' : (kpis.fleetProductivityPaqH >= 1.2 ? 'target-warn' : 'target-bad'),
      progressPct: Math.min(100, Math.max(0, (kpis.fleetProductivityPaqH / 1.5) * 100)),
      tooltip: 'Suma de Paquetes y Cancelados exclusivamente de turnos válidos (Confirmados, Reemplazo, Adicional TaDa y Adicional autorizados). Horas gestionadas = Total de turnos válidos × 8 horas.'
    },
    {
      label: '8. Productividad Flota',
      isHero: true,
      heroTag: 'Eficiencia Flota',
      value: `${kpis.fleetProductivityPaqH.toFixed(2)} paq/h`,
      sub: `${fmtNum(kpis.totalPackages, 0)} paquetes / ${fmtNum(kpis.totalManagedHours, 0)} horas (${fmtNum(kpis.validManagedShiftsCount, 0)} turnos válidos × 8h)`,
      icon: '⚡',
      colorClass: kpis.fleetProductivityPaqH >= 1.5 ? 'kpi-emerald' : (kpis.fleetProductivityPaqH >= 1.2 ? 'kpi-amber' : 'kpi-rose'),
      target: 'Meta: ≥1.5 paq/h',
      targetClass: kpis.fleetProductivityPaqH >= 1.5 ? 'target-good' : (kpis.fleetProductivityPaqH >= 1.2 ? 'target-warn' : 'target-bad'),
      progressPct: Math.min(100, Math.max(0, (kpis.fleetProductivityPaqH / 1.5) * 100)),
      tooltip: 'Productividad de la Flota = Volumen total de paquetería (Paquetería + Cancelados) ÷ Horas gestionadas (turnos válidos × 8h). Meta oficial: ≥1.5 paq/h evaluada exclusivamente sobre Confirmados, Reemplazo, Adicional TaDa y Adicional autorizados.'
    },
    (() => {
      const dist = kpis.asistenciaProgDistribution || {
        totalValidShifts: 0,
        totalPilots: 0,
        avgShiftsPerPilot: 0,
        cat1Pilots: 0, cat1Shifts: 0, cat1Pct: 0, cat1PilotsPct: 0,
        cat2Pilots: 0, cat2Shifts: 0, cat2Pct: 0, cat2PilotsPct: 0,
        cat3Pilots: 0, cat3Shifts: 0, cat3Pct: 0, cat3PilotsPct: 0
      };

      const p1Pct = dist.cat1PilotsPct ?? dist.cat1Pct ?? 0;
      const p2Pct = dist.cat2PilotsPct ?? dist.cat2Pct ?? 0;
      const p3Pct = dist.cat3PilotsPct ?? dist.cat3Pct ?? 0;

      const progCardColor = p3Pct >= 35 ? 'kpi-emerald' : (p3Pct >= 20 ? 'kpi-amber' : 'kpi-rose');

      return {
        label: '9. Promedio de Asistencia',
        isHero: true,
        heroTag: 'Programación Semanal',
        isWide: true,
        value: `${fmtNum(dist.totalPilots, 0)} pilotos`,
        target: `Meta: 5-7 turnos (${p3Pct}% flota)`,
        targetClass: p3Pct >= 35 ? 'target-good' : (p3Pct >= 20 ? 'target-warn' : 'target-bad'),
        icon: '📊',
        colorClass: progCardColor,
        customProgressBar: `
          <div class="kpi-progress-bar" style="display:flex;height:6px;border-radius:3px;overflow:hidden;background:rgba(255,255,255,0.08);gap:1px;" title="Azul: 1-2 turnos (${p1Pct}%) | Amarillo: 3-4 turnos (${p2Pct}%) | Verde: 5-7 turnos (${p3Pct}%)">
            <div style="width:${p1Pct}%;background:#60a5fa;" title="1 a 2 turnos: ${fmtNum(dist.cat1Pilots, 0)} pilotos (${p1Pct}%)"></div>
            <div style="width:${p2Pct}%;background:#f59e0b;" title="3 a 4 turnos: ${fmtNum(dist.cat2Pilots, 0)} pilotos (${p2Pct}%)"></div>
            <div style="width:${p3Pct}%;background:#10b981;" title="5 a 7 turnos: ${fmtNum(dist.cat3Pilots, 0)} pilotos (${p3Pct}%)"></div>
          </div>
        `,
        progressPct: Math.min(100, Math.max(0, p3Pct)),
        sub: `
          <div class="asistencia-prog-grid">
            <!-- Categoría 1: 1 a 2 turnos -->
            <div class="asistencia-prog-col col-baja">
              <div class="asistencia-prog-col-header">
                <span class="asistencia-range">🔵 1 a 2 turnos</span>
                <span class="asistencia-badge badge-baja">Baja</span>
              </div>
              <div class="asistencia-prog-numbers">
                <span class="asistencia-pilots-val">${fmtNum(dist.cat1Pilots, 0)} <small>pilotos</small></span>
                <span class="asistencia-pct-val pct-baja">${p1Pct}%</span>
              </div>
              <div class="asistencia-shifts-val">${fmtNum(dist.cat1Shifts, 0)} turnos válidos</div>
            </div>

            <!-- Categoría 2: 3 a 4 turnos -->
            <div class="asistencia-prog-col col-media">
              <div class="asistencia-prog-col-header">
                <span class="asistencia-range">🟡 3 a 4 turnos</span>
                <span class="asistencia-badge badge-media">Media</span>
              </div>
              <div class="asistencia-prog-numbers">
                <span class="asistencia-pilots-val">${fmtNum(dist.cat2Pilots, 0)} <small>pilotos</small></span>
                <span class="asistencia-pct-val pct-media">${p2Pct}%</span>
              </div>
              <div class="asistencia-shifts-val">${fmtNum(dist.cat2Shifts, 0)} turnos válidos</div>
            </div>

            <!-- Categoría 3: 5 a 7 turnos -->
            <div class="asistencia-prog-col col-alta">
              <div class="asistencia-prog-col-header">
                <span class="asistencia-range">🟢 5 a 7 turnos</span>
                <span class="asistencia-badge badge-alta">Alta (Meta)</span>
              </div>
              <div class="asistencia-prog-numbers">
                <span class="asistencia-pilots-val">${fmtNum(dist.cat3Pilots, 0)} <small>pilotos</small></span>
                <span class="asistencia-pct-val pct-alta">${p3Pct}%</span>
              </div>
              <div class="asistencia-shifts-val">${fmtNum(dist.cat3Shifts, 0)} turnos válidos</div>
            </div>
          </div>
        `,
        tooltip: 'Distribución de pilotos por programación semanal calculada exclusivamente sobre Confirmados, Reemplazo, Adicional TaDa y Adicional autorizados. Conteo: cantidad de pilotos únicos por rango de turnos; Porcentaje: proporción sobre el total de pilotos filtrados (' + fmtNum(dist.totalPilots, 0) + ' pilotos = 100%).'
      };
    })()
  ];

  container.innerHTML = cards.map(c => `
    <div class="kpi-card ${c.colorClass} ${c.isHero ? 'kpi-hero' : ''} ${c.isWide ? 'kpi-card-wide' : ''}">
      <div class="kpi-header">
        <div class="kpi-label-wrap">
          <span class="kpi-label">${c.label}</span>
          ${c.heroTag ? `<span class="hero-pill">${c.heroTag}</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <button type="button" class="kpi-info-btn" title="${escapeHtml(c.tooltip)}">ℹ️</button>
          <span class="kpi-icon">${c.icon}</span>
        </div>
      </div>
      <div class="kpi-value">${c.value}</div>
      <div class="kpi-target-row">
        <span class="kpi-target-tag ${c.targetClass}">${c.target}</span>
      </div>
      ${c.customProgressBar || `
      <div class="kpi-progress-bar">
        <div class="kpi-progress-fill" style="width: ${c.progressPct.toFixed(1)}%;"></div>
      </div>`}
      <div class="kpi-sub">${c.sub}</div>
    </div>
  `).join('');
}

// ============================================================
// MÓDULO 1: TABLA DE PRODUCTIVIDAD CON MATCH COMPUESTO
// Solución a Truncamiento: Renderiza 100% de los registros sin paginación
// Exclusiones Oficiales por Defecto + Multiselect de Estados
// Nuevo Orden de Columnas: Fecha | Día | Piloto / ID | Punto / Seller | Inicio | Estado | Paquetes Reales | Promedio de Paquetes (Meta) | Evaluación | Ficha
// ============================================================
function renderMallaProductivityTable() {
  const tbody = document.getElementById('tableMallaProductividad');
  const countEl = document.getElementById('mallaRowsCount');
  const badgeEl = document.getElementById('mallaTotalRenderedBadge');
  if (!tbody) return;

  // Exclusiones por defecto oficiales:
  // Piloto Cancela, Adicional Cancela, Tienda Cerrada, Cliente Cancela, No Programado y filas vacías.
  const defaultExclusions = new Set([
    'piloto cancela',
    'cancela piloto',
    'piloto canceló',
    'adicional cancela',
    'adicional cancelado',
    'tienda cerrada',
    'cliente cancela',
    'no programado'
  ]);

  let rowsToDisplay = AppState.filteredMalla;

  if (AppState.selectedStatuses && AppState.selectedStatuses.length > 0) {
    // Si el usuario seleccionó estados específicos en el multiselect, comparar solo esos estados
    const targetSet = new Set(AppState.selectedStatuses.map(s => normalizeKeyStr(s)));
    rowsToDisplay = rowsToDisplay.filter(r => targetSet.has(normalizeKeyStr(r.status)));
  } else {
    // Exclusiones por defecto oficiales
    rowsToDisplay = rowsToDisplay.filter(r => {
      const st = (r.status || '').trim();
      if (!st) return false;
      if (defaultExclusions.has(st.toLowerCase())) return false;
      return true;
    });
  }

  const total = rowsToDisplay.length;
  const pageSize = AppState.mallaPageSize != null ? AppState.mallaPageSize : 100;
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;
  if (AppState.mallaPage > totalPages) AppState.mallaPage = Math.max(1, totalPages);
  const page = AppState.mallaPage || 1;

  const startIdx = pageSize > 0 ? (page - 1) * pageSize : 0;
  const endIdx = pageSize > 0 ? Math.min(startIdx + pageSize, total) : total;

  if (countEl) countEl.innerText = `${fmtNum(total, 0)} turnos encontrados · Mostrando ${total > 0 ? startIdx + 1 : 0} a ${endIdx}`;
  if (badgeEl) badgeEl.innerText = pageSize > 0 && total > pageSize ? `Página ${page} de ${totalPages} · ${fmtNum(total, 0)} turnos` : `100% visible · ${fmtNum(total, 0)} filas`;

  const summaryEl = document.getElementById('mallaPageSummary');

  if (total === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-dim);">No hay registros para este filtro o todos fueron excluidos por defecto.</td></tr>`;
    if (summaryEl) summaryEl.innerHTML = 'Sin turnos para mostrar.';
    return;
  }

  // Ordenar por fecha descendente
  const sorted = rowsToDisplay.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const pageRows = pageSize > 0 ? sorted.slice(startIdx, endIdx) : sorted;

  // Actualizar controles de paginación
  if (summaryEl) {
    if (total <= 100 && pageSize === 100) {
      summaryEl.innerHTML = `Renderizando el 100% de los turnos (${total} filas).`;
    } else {
      summaryEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span>Página <strong>${page}</strong> de <strong>${totalPages}</strong> (${startIdx + 1}–${endIdx} de ${total})</span>
          <div style="display:inline-flex;gap:4px;">
            <button class="btn btn-secondary" style="padding:2px 8px;font-size:0.75rem;" ${page <= 1 ? 'disabled' : ''} onclick="changeMallaPage(${page - 1})">◀ Ant</button>
            <button class="btn btn-secondary" style="padding:2px 8px;font-size:0.75rem;" ${page >= totalPages ? 'disabled' : ''} onclick="changeMallaPage(${page + 1})">Sig ▶</button>
          </div>
          <span style="margin-left:auto;">
            Por página:
            <select onchange="changeMallaPageSize(this.value)" class="filter-select" style="padding:2px 6px;height:26px;font-size:0.75rem;min-width:70px;">
              <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
              <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
              <option value="250" ${pageSize === 250 ? 'selected' : ''}>250</option>
              <option value="0" ${pageSize === 0 ? 'selected' : ''}>Todos (${total})</option>
            </select>
          </span>
        </div>
      `;
    }
  }

  // Nuevo orden de columnas: Fecha | Día | Piloto / ID | Punto / Seller | Inicio | Estado | Paquetes Reales | Promedio de Paquetes (Meta) | Evaluación | Ficha
  tbody.innerHTML = pageRows.map(r => {
    const targetVal = r.target_productivity ? `${r.target_productivity} paqs` : '—';
    const realVal = r.packages != null ? `${r.packages} paqs` : '0 paqs';
    const evalP = evaluateProductivityMatch(r.packages, r.target_productivity, APP_CONFIG);
    const safePilotEnc = encodeURIComponent(r.pilot || '');

    return `
      <tr>
        <td>${r.date || '—'}</td>
        <td>${escapeHtml(r.weekday || '—')}</td>
        <td>
          <div class="pilot-name-cell">
            <a href="javascript:void(0)" onclick="selectPilotForProfile(decodeURIComponent('${safePilotEnc}'))" style="color:#fff;text-decoration:none;">${escapeHtml(r.pilot || '—')}</a>
            <span class="pilot-meta">${escapeHtml(r.pilot_id)} · ${escapeHtml(r.city)}</span>
          </div>
        </td>
        <td><strong>${escapeHtml(r.store || '—')}</strong></td>
        <td>${fmtMinutes(r.start)}</td>
        <td><span class="pill ${r.pilot_cancel ? 'pill-bad' : r.attended ? 'pill-good' : 'pill-neutral'}">${escapeHtml(r.status || '—')}</span></td>
        <td><strong>${realVal}</strong></td>
        <td>${targetVal}</td>
        <td><span class="pill ${evalP.badgeClass}">${evalP.label} (${evalP.ratioPct != null ? evalP.ratioPct + '%' : '—'})</span></td>
        <td>
          <button class="btn btn-secondary btn-icon-only" onclick="selectPilotForProfile(decodeURIComponent('${safePilotEnc}'))" title="Ver Ficha 360°">👤</button>
        </td>
      </tr>
    `;
  }).join('');

  restoreTableSort('tableMallaWrapper');
}

function changeMallaPage(newPage) {
  AppState.mallaPage = newPage;
  renderMallaProductivityTable();
  document.getElementById('tableMallaWrapper')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function changeMallaPageSize(newSize) {
  AppState.mallaPageSize = Number(newSize);
  AppState.mallaPage = 1;
  renderMallaProductivityTable();
}

// ============================================================
// MÓDULO 2: PLANIFICACIÓN Y COBERTURA PREVENTIVA
// ============================================================
function renderModulo2Coverage() {
  const tableCoverage = document.getElementById('tableCoverageStores');
  const tableRisk = document.getElementById('tableScheduledShiftsRisk');
  if (!tableCoverage || !tableRisk) return;

  // Determinar el rango de fechas activo desde los filtros globales
  const fromRaw = document.getElementById('filterFrom')?.value || '';
  const toRaw = document.getElementById('filterTo')?.value || '';
  const fromIso = parseHybridDate(fromRaw);
  const toIso = parseHybridDate(toRaw);
  const hasDateFilter = !!(fromIso || toIso);

  // 0. Panel de Periodo Filtrado (refleja el rango activo del usuario, no solo la semana actual)
  {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    let panelLabel = '';
    let panelShifts = [];

    if (hasDateFilter) {
      // Usar el rango de filtro activo del usuario (exactamente los turnos de filteredProg)
      panelShifts = AppState.filteredProg;
      const wsDate = fromIso ? parseDateToNoon(fromIso) : null;
      const weDate = toIso ? parseDateToNoon(toIso) : null;
      const fromLabel = wsDate ? `${wsDate.getDate()} ${monthNames[wsDate.getMonth()]} ${wsDate.getFullYear()}` : fromIso;
      const toLabel = weDate ? `${weDate.getDate()} ${monthNames[weDate.getMonth()]} ${weDate.getFullYear()}` : toIso;
      panelLabel = `Periodo filtrado: ${fromLabel} – ${toLabel} · ${panelShifts.length} registros`;
    } else if (AppState.temporal) {
      // Sin filtro de fechas: mostrar semana operativa actual
      const curr = AppState.temporal.currentWeek;
      const ws = parseDateToNoon(curr.startDate);
      const we = parseDateToNoon(curr.endDate);
      panelShifts = AppState.progShifts.filter(s => isDateInRangeWithNoonCut(s.date, curr.startDate, curr.endDate));
      panelLabel = `Sem ${curr.weekNumber} · ${ws.getDate()} ${monthNames[ws.getMonth()]} – ${we.getDate()} ${monthNames[we.getMonth()]} ${we.getFullYear()} · ${panelShifts.length} turnos`;
    } else {
      panelShifts = AppState.filteredProg;
      panelLabel = `${panelShifts.length} turnos en el rango actual`;
    }

    const panelMatch = typeof reconcileShiftsMatch === 'function' ? reconcileShiftsMatch(panelShifts) : null;
    const weekTotal = panelMatch ? panelMatch.totalSlotsRequired : panelShifts.length;
    const weekAssigned = panelMatch ? panelMatch.totalSlotsCovered : panelShifts.filter(s => !s.is_vacant).length;
    const weekVacant = Math.max(panelMatch ? panelMatch.totalSlotsMissing : 0, Math.max(0, weekTotal - weekAssigned));
    const weekCovPct = weekTotal > 0 ? Math.round((weekAssigned / weekTotal) * 100) : 100;

    const labelEl = document.getElementById('currentWeekCoverageLabel');
    if (labelEl) labelEl.innerText = panelLabel;

    const kpisEl = document.getElementById('currentWeekCoverageKpis');
    if (kpisEl) {
      const mini = (label, value, sub, color) => `
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px 16px; border-left: 3px solid ${color};">
          <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.04em; margin-bottom: 4px;">${label}</div>
          <div style="font-size: 1.55rem; font-weight: 800; color: #fff;">${value}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${sub}</div>
        </div>
      `;
      kpisEl.innerHTML = [
        mini('Cupos Totales', weekTotal, 'turnos requeridos en el periodo', '#8b5cf6'),
        mini('Cubiertos ✅', weekAssigned, `${panelMatch?.totalMatchedReplacements || 0} reemplazos matched`, '#10b981'),
        mini(weekVacant > 0 ? '🚨 Cupos Faltantes' : 'Cupos Faltantes', weekVacant,
          weekVacant > 0 ? `${panelMatch?.totalUnmatchedCancels || 0} cancelados sin reemplazo` : 'Flota completa ✔',
          weekVacant > 0 ? '#ef4444' : '#10b981'),
        mini('Cobertura %', `${weekCovPct}%`, `${weekCovPct >= 100 ? 'Flota completa' : 'Faltante por cubrir'}`, weekCovPct >= 100 ? '#10b981' : weekCovPct >= 80 ? '#f59e0b' : '#ef4444')
      ].join('');
    }
  }

  // 1. Análisis de Cobertura por Tienda
  // Usa AppState.filteredProg que ya respeta el filtro de fecha activo
  const coverage = CoverageEngine.analyzeCoverage(AppState.filteredProg);
  AppState.coverageAnalysis = coverage;

  // Vacantes detectadas: de-duplicar por (fecha, tienda, hora inicio) para evitar doble conteo
  const vacancyDetailMap = new Map();
  AppState.filteredProg.forEach(s => {
    if (!s.is_vacant) return;
    const dateKey = parseHybridDate(s.date) || String(s.date || '').trim();
    const storeKey = String(s.store || '').trim();
    const startKey = s.start != null ? Number(s.start) : -1;
    const uid = `${dateKey}__${storeKey.toLowerCase()}__${startKey}`;
    if (!vacancyDetailMap.has(uid)) {
      vacancyDetailMap.set(uid, s);
    }
  });
  const deduplicatedVacancies = Array.from(vacancyDetailMap.values());

  tableCoverage.innerHTML = coverage.stores.map(st => {
    // Cupos faltantes reales: diferencia directa entre requeridos y asignados (o st.vacant)
    const storeVacancies = deduplicatedVacancies.filter(s => (s.store || '').trim() === st.store);
    const calculatedMissing = Math.max(0, (st.total || 0) - (st.assigned || 0));
    const vacantCount = Math.max(st.vacant || 0, calculatedMissing, storeVacancies.length);
    const isFull = vacantCount === 0 && (st.coveragePct >= 100);
    const barColor = isFull ? '#10b981' : (st.coveragePct >= 95 ? '#f59e0b' : '#ef4444');

    return `
      <tr style="${vacantCount > 0 ? 'background: rgba(239, 68, 68, 0.05);' : ''}">
        <td><strong>${escapeHtml(st.store)}</strong></td>
        <td><span class="pill pill-neutral">${escapeHtml(st.city)}</span></td>
        <td><strong>${st.total}</strong></td>
        <td><span class="pill pill-good" style="font-weight: 700;">${st.assigned}</span></td>
        <td>
          <span class="pill ${vacantCount > 0 ? 'badge-cupo-faltante' : 'pill-neutral'}" style="${vacantCount > 0 ? 'padding: 4px 10px; font-size: 0.82rem;' : 'color: var(--text-muted);'}">
            ${vacantCount > 0 ? `🚨 ${vacantCount} faltante${vacantCount > 1 ? 's' : ''}` : '0'}
          </span>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:7px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
              <div style="width:${st.coveragePct}%;height:100%;background:${barColor};border-radius:4px;"></div>
            </div>
            <strong style="font-size:0.75rem;color:${barColor};">${st.coveragePct}%</strong>
          </div>
        </td>
        <td>
          ${vacantCount > 0
            ? '<span class="pill pill-bad" style="font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">🚨 Requiere Cobertura</span>'
            : '<span class="pill pill-good" style="display: inline-flex; align-items: center; gap: 4px;">✅ Cubierto</span>'}
        </td>
      </tr>
    `;
  }).join('');

  restoreTableSort(tableCoverage.closest('table'));

  // 2. Scoring de Riesgo y Alertas de Reemplazo
  // Para el scoring de riesgo preventivo: evaluar SOLO los turnos del periodo filtrado activo
  // pero calcular el historial acumulado de pilotos desde la malla completa (sin perder trazabilidad)
  const filteredProgShifts = AppState.filteredProg || [];
  const evaluatedShifts = CoverageEngine.evaluateScheduledShiftsRisk(
    filteredProgShifts,
    AppState.mallaShifts, // historial completo de pilotos para scoring
    APP_CONFIG
  );

  // Poblar el filtro de tiendas de la tabla (basado en el periodo activo)
  const riskStoreFilter = document.getElementById('riskStoreFilter');
  if (riskStoreFilter) {
    const uniqueStores = [...new Set(filteredProgShifts.map(s => s.store).filter(Boolean))].sort();
    const currentStoreVal = riskStoreFilter.value;
    riskStoreFilter.innerHTML = '<option value="">Todas las tiendas</option>' +
      uniqueStores.map(st => `<option value="${escapeHtml(st)}"${st === currentStoreVal ? ' selected' : ''}>${escapeHtml(st)}</option>`).join('');
  }

  // Guardar en AppState para paginación reactiva
  AppState._allEvaluatedRiskShifts = evaluatedShifts;
  AppState._riskTablePage = AppState._riskTablePage || 1;
  renderRiskTablePage();
}

// ============================================================
// TABLA HISTÓRICA DE RIESGO: Renderizado paginado y filtrado
// ============================================================
const RISK_PAGE_SIZE = 50;

function renderRiskTablePage() {
  const tableRisk = document.getElementById('tableScheduledShiftsRisk');
  if (!tableRisk) return;

  const allEvaluated = AppState._allEvaluatedRiskShifts || [];
  const searchVal = (document.getElementById('riskTableSearch')?.value || '').toLowerCase().trim();
  const alertFilter = document.getElementById('riskAlertFilter')?.value || '';
  const storeFilterVal = document.getElementById('riskStoreFilter')?.value || '';

  // Ordenar por severidad de alerta
  const order = { cancel_unmatched: 1, vacant: 2, high: 3, medium: 4, cancel_with_replacement: 5, replacement: 6, low: 7, excluded: 8, unknown: 9 };
  const sorted = allEvaluated.slice().sort((a, b) => (order[a.risk?.level] || 99) - (order[b.risk?.level] || 99));

  // Aplicar filtros
  const filtered = sorted.filter(s => {
    if (alertFilter && s.risk?.level !== alertFilter) return false;
    if (storeFilterVal && s.store !== storeFilterVal) return false;
    if (searchVal) {
      const haystack = [s.date, s.store, s.weekday, s.pilot, s.phone, s.status, s.risk?.label].join(' ').toLowerCase();
      if (!haystack.includes(searchVal)) return false;
    }
    return true;
  });

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / RISK_PAGE_SIZE));
  AppState._riskTablePage = Math.min(AppState._riskTablePage || 1, totalPages);
  const page = AppState._riskTablePage;
  const from = (page - 1) * RISK_PAGE_SIZE;
  const to = from + RISK_PAGE_SIZE;
  const pageItems = filtered.slice(from, to);

  // Actualizar badge y paginación
  const badge = document.getElementById('riskTotalBadge');
  if (badge) badge.innerText = `${filtered.length} de ${allEvaluated.length} turnos`;

  const infoEl = document.getElementById('riskPaginationInfo');
  if (infoEl) {
    infoEl.innerText = filtered.length === 0
      ? 'Sin resultados'
      : `Mostrando ${from + 1} – ${Math.min(to, filtered.length)} de ${filtered.length} turnos`;
  }

  const pgEl = document.getElementById('riskPageNumber');
  if (pgEl) pgEl.innerText = `Pág. ${page} / ${totalPages}`;

  const prevBtn = document.getElementById('riskBtnPrevPage');
  const nextBtn = document.getElementById('riskBtnNextPage');
  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= totalPages;

  if (pageItems.length === 0) {
    tableRisk.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:28px;color:var(--text-muted);">Sin turnos que coincidan con los filtros seleccionados.</td></tr>`;
    return;
  }

  tableRisk.innerHTML = pageItems.map((s, idx) => {
    const isVacant = s.is_vacant;
    const isUnmatched = s.risk?.level === 'cancel_unmatched';
    const isCancelWithRep = s.risk?.level === 'cancel_with_replacement';
    const globalIdx = from + idx;

    const pilotCell = isVacant
      ? `<span style="color:#ff6b6b;font-weight:700;">[SIN ASIGNAR]</span>`
      : `<div class="pilot-name-cell"><span>${escapeHtml(s.pilot || '—')}</span><span class="pilot-meta">${escapeHtml(s.phone || '')}</span></div>`;

    const replacementInfo = isCancelWithRep && s.replacementPilot
      ? `<div style="font-size:0.72rem;color:#10b981;margin-top:3px;">↳ Reemplazo: ${escapeHtml(s.replacementPilot)}</div>`
      : '';

    const accionesCell = `
      <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
        ${(isVacant || isUnmatched || s.risk?.level === 'high')
          ? `<button class="btn btn-primary btn-sm" onclick="openSuplentesModalForShift(${globalIdx})" title="Buscar suplente">🔍 Suplente</button>`
          : `<button class="btn btn-secondary btn-sm" onclick="openSuplentesModalForShift(${globalIdx})" title="Sugerir suplente">🔍 Sugerir</button>`}
        ${!isVacant ? `<button class="btn btn-secondary btn-sm" style="color:#f87171;padding:4px 6px;" onclick="cancelOrReleaseShift(${globalIdx})" title="Liberar">✕</button>` : ''}
      </div>`;

    return `
      <tr class="${isUnmatched ? 'row-alert-critical' : ''}">
        <td>${s.date || '—'}</td>
        <td>${escapeHtml(s.store || '—')}</td>
        <td>${escapeHtml(s.weekday || '—')}</td>
        <td style="white-space:nowrap;">${fmtMinutes(s.start)} – ${fmtMinutes(s.end_time)}</td>
        <td><span class="pill ${s.pilot_cancel ? 'pill-bad' : s.attended ? 'pill-good' : 'pill-neutral'}" style="font-size:0.72rem;">${escapeHtml(s.status || '—')}</span></td>
        <td>${pilotCell}</td>
        <td><span class="pill ${s.risk?.badgeClass || 'pill-neutral'}">${s.risk?.label || '—'}</span></td>
        <td style="font-size:0.73rem;color:var(--text-muted);max-width:240px;">
          ${s.risk?.description || '—'}
          ${replacementInfo}
        </td>
        <td>${accionesCell}</td>
      </tr>`;
  }).join('');

  restoreTableSort(tableRisk.closest('table'));
}

// Registrar eventos de paginación y filtros de la tabla histórica (inicialización única)
function initRiskTableControls() {
  const onFilterChange = () => {
    AppState._riskTablePage = 1;
    renderRiskTablePage();
  };
  document.getElementById('riskTableSearch')?.addEventListener('input', onFilterChange);
  document.getElementById('riskAlertFilter')?.addEventListener('change', onFilterChange);
  document.getElementById('riskStoreFilter')?.addEventListener('change', onFilterChange);
  document.getElementById('riskBtnPrevPage')?.addEventListener('click', () => {
    AppState._riskTablePage = Math.max(1, (AppState._riskTablePage || 1) - 1);
    renderRiskTablePage();
  });
  document.getElementById('riskBtnNextPage')?.addEventListener('click', () => {
    const all = AppState._allEvaluatedRiskShifts || [];
    const total = Math.max(1, Math.ceil(all.length / RISK_PAGE_SIZE));
    AppState._riskTablePage = Math.min(total, (AppState._riskTablePage || 1) + 1);
    renderRiskTablePage();
  });
}

// ============================================================
// MÓDULO 3: ANALÍTICA DE SEMANAS & COMPARATIVO HISTÓRICO
// ============================================================
function renderModulo3Visuals() {
  if (!AppState.mallaShifts || AppState.mallaShifts.length === 0) return;

  const weeks = AppState.availableWeeks.length > 0 ? AppState.availableWeeks : computeAvailableWeeks(AppState.mallaShifts);

  // Determinar la semana seleccionada para la vista detallada
  let selectedWeek = null;
  if (AppState.selectedModulo3Week) {
    selectedWeek = weeks.find(w => w.weekKey === AppState.selectedModulo3Week);
  }
  if (!selectedWeek) {
    // Buscar la semana más reciente que tenga turnos en Malla evaluando con corte de 12:00 PM
    selectedWeek = weeks.find(w => {
      return AppState.mallaShifts.some(s => isDateInRangeWithNoonCut(s.date, w.startDate, w.endDate));
    }) || weeks[0];
    if (selectedWeek) AppState.selectedModulo3Week = selectedWeek.weekKey;
  }

  // Actualizar títulos
  const titleEl = document.getElementById('modulo3WeekTitle');
  const subEl = document.getElementById('modulo3WeekSubtitle');
  const weekSelect = document.getElementById('modulo3WeekSelect');
  const cityVal = document.getElementById('filterCity')?.value || '';

  if (titleEl && selectedWeek) {
    titleEl.innerText = `📊 Métricas Operativas: ${selectedWeek.label}${cityVal ? ' · ' + cityVal : ''}`;
  }
  if (subEl && selectedWeek) {
    subEl.innerText = `Análisis de la operación del ${selectedWeek.startDate} al ${selectedWeek.endDate}`;
  }
  if (weekSelect && selectedWeek && weekSelect.value !== selectedWeek.weekKey) {
    weekSelect.value = selectedWeek.weekKey;
  }

  // Filtrar los turnos de la semana seleccionada respetando el filtro de ciudad/tienda actual con corte de 12:00 PM
  // Importante: Extraer directamente de AppState.mallaShifts para no colisionar con los DatePickers del encabezado
  const city = document.getElementById('filterCity')?.value || '';
  const store = document.getElementById('filterStore')?.value || '';
  const pilotQuery = (document.getElementById('filterPilot')?.value || '').trim().toLowerCase();

  const targetMalla = AppState.mallaShifts.filter(s => {
    if (city && s.city !== city) return false;
    if (store && s.store !== store) return false;
    if (pilotQuery) {
      const matchP = (s.pilot || '').toLowerCase().includes(pilotQuery);
      const matchId = (s.pilot_id || '').toLowerCase().includes(pilotQuery);
      if (!matchP && !matchId) return false;
    }
    return selectedWeek && isDateInRangeWithNoonCut(s.date, selectedWeek.startDate, selectedWeek.endDate);
  });

  const targetProg = AppState.progShifts.filter(s => {
    if (city && s.city !== city) return false;
    if (store && s.store !== store) return false;
    return selectedWeek && isDateInRangeWithNoonCut(s.date, selectedWeek.startDate, selectedWeek.endDate);
  });

  // 1. Tarjeta KPI: Promedio de turnos asignados por piloto en el periodo (Req 13)
  const isShiftEvaluable = s => (s.evaluable !== undefined ? Boolean(s.evaluable) : (!s.excluded && (s.attended || s.pilot_cancel)));
  const uniquePilotsSet = new Set(targetMalla.filter(s => isShiftEvaluable(s) && s.pilot).map(s => s.pilot));
  const validAssignmentsCount = targetMalla.filter(s => isShiftEvaluable(s) && s.pilot).length;
  const avgShiftsPerPilot = uniquePilotsSet.size > 0 ? (validAssignmentsCount / uniquePilotsSet.size) : null;

  const avgKpiEl = document.getElementById('kpiAvgShiftsPerPilotValue');
  if (avgKpiEl) avgKpiEl.innerText = avgShiftsPerPilot != null ? avgShiftsPerPilot.toFixed(1) : 'N/A';
  const pilKpiEl = document.getElementById('kpiUniquePilotsCount');
  if (pilKpiEl) pilKpiEl.innerText = `${uniquePilotsSet.size} pilotos`;
  const assignKpiEl = document.getElementById('kpiValidAssignmentsCount');
  if (assignKpiEl) assignKpiEl.innerText = `${validAssignmentsCount} asignaciones`;

  // Inicializar los gráficos principales de esa semana
  ChartManager.initCurrentWeekCharts(
    targetMalla,
    targetProg
  );

  // Selector dinámico para Gráfica 5: Desempeño por Ciudad y Tienda (Req 7)
  const citySelect = document.getElementById('chartCitySelect');
  if (citySelect) {
    const currentCityVal = citySelect.value;
    const availableCities = [...new Set(AppState.mallaShifts.map(s => s.city).filter(Boolean))].sort();
    citySelect.innerHTML = '<option value="">Todas las Ciudades</option>' +
      availableCities.map(c => `<option value="${escapeHtml(c)}"${c === currentCityVal ? ' selected' : ''}>${escapeHtml(c)}</option>`).join('');

    if (!citySelect._hasCityListener) {
      citySelect._hasCityListener = true;
      citySelect.addEventListener('change', () => {
        ChartManager.renderCityStorePerformanceChart('chartCityStorePerformance', targetMalla, citySelect.value);
      });
    }
  }

  // Renderizar Gráfica 5: Desempeño Operativo por Ciudad y Tienda (Req 7)
  ChartManager.renderCityStorePerformanceChart('chartCityStorePerformance', targetMalla, citySelect?.value || '');

  // Renderizar Gráfica 6: Comparativo Mes Actual vs. Mes Anterior con corte equivalente (Req 8)
  ChartManager.renderMonthVsPreviousMonthChart('chartMonthVsPreviousMonth', AppState.mallaShifts);

  // ============================================================
  // TENDENCIA HISTÓRICA SEMANA A SEMANA (Visual de Semanas Pasadas)
  // ============================================================
  // Agrupar el dataset por semana para calcular métricas históricas
  const baseShiftsForTrends = AppState.mallaShifts.filter(s => {
    if (city && s.city !== city) return false;
    if (store && s.store !== store) return false;
    return true;
  });

  const weeklyMetrics = [];
  // Tomar TODAS las semanas disponibles ordenadas cronológicamente (desde las más antiguas a las más recientes)
  const recentWeeksChronological = weeks.slice().reverse();

  recentWeeksChronological.forEach(w => {
    const shiftsInWeek = baseShiftsForTrends.filter(s => isDateInRangeWithNoonCut(s.date, w.startDate, w.endDate));
    if (shiftsInWeek.length === 0) return;

    // APLICAR REGLAS OFICIALES DE LAS TARJETAS KPI (reconcileShiftsMatch + Cancelaciones vs Reemplazos + Exclusiones)
    const kpi = calculateModulo1Kpis(shiftsInWeek, APP_CONFIG);
    weeklyMetrics.push({
      weekKey: w.weekKey,
      weekLabel: `Sem ${w.weekNumber}`,
      fullLabel: w.label,
      startDate: w.startDate,
      endDate: w.endDate,
      totalShifts: kpi.asistenciaRequiredCount > 0 ? kpi.asistenciaRequiredCount : shiftsInWeek.length,
      rawTotalShifts: shiftsInWeek.length,
      attendancePct: kpi.asistenciaEffectivenessPct || 0,
      cancellationPct: kpi.cancellationNetRatePct != null ? kpi.cancellationNetRatePct : (kpi.cancellationRatePct || 0),
      cancellationGrossPct: kpi.cancellationRatePct || 0,
      cuposCoveragePct: kpi.cuposCoveragePct || 0,
      cuposCoveredCount: kpi.cuposCoveredCount,
      cuposEvaluatedCount: kpi.cuposEvaluatedCount,
      punctualityPct: kpi.punctualityPct || 0,
      totalPackages: kpi.totalPackages || 0,
      productivity: kpi.fleetProductivityPaqH,
      attendedCount: kpi.asistenciaCoveredCount,
      cancelCount: kpi.penalizedBreakdown ? kpi.penalizedBreakdown.pilotCancel : 0,
      missingCount: kpi.cuposFaltantesTotal || 0
    });
  });

  // Renderizar gráficos de tendencia
  if (weeklyMetrics.length > 0) {
    ChartManager.renderWeeklyTrendChart('chartWeeklyTrend', weeklyMetrics);
    ChartManager.renderWeeklyVolumeChart('chartWeeklyVolume', weeklyMetrics);
  }

  // Renderizar tabla resumen histórico de semanas pasadas
  const tableSummaryEl = document.getElementById('tableWeeklyHistoricalSummary');
  const cityNoteEl = document.getElementById('weeklyTableCityNote');
  if (cityNoteEl) {
    const filterParts = [];
    if (city) filterParts.push(`Ciudad: ${city}`);
    if (store) filterParts.push(`Punto: ${store}`);
    cityNoteEl.innerText = filterParts.length > 0 ? `Filtrado por: ${filterParts.join(' · ')}` : 'Todas las ciudades y puntos';
  }

  if (tableSummaryEl) {
    // Mostrar de la más reciente a la más antigua
    const displayWeeks = weeklyMetrics.slice().reverse();
    if (displayWeeks.length === 0) {
      tableSummaryEl.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-dim);">No hay registros históricos para esta selección.</td></tr>`;
    } else {
      tableSummaryEl.innerHTML = displayWeeks.map(w => {
        const attColor = w.attendancePct >= 90 ? 'badge-optimo' : (w.attendancePct >= 80 ? 'badge-aceptable' : 'badge-bajo');
        const canColor = w.cancellationPct <= 5 ? 'badge-optimo' : (w.cancellationPct <= 10 ? 'badge-aceptable' : 'badge-bajo');
        const covColor = w.cuposCoveragePct >= 95 ? 'badge-optimo' : (w.cuposCoveragePct >= 85 ? 'badge-aceptable' : 'badge-bajo');
        const isCurrent = AppState.selectedModulo3Week === w.weekKey;

        return `
          <tr style="${isCurrent ? 'background: rgba(139, 92, 246, 0.12);' : ''}">
            <td style="font-weight:700;color:#fff;">
              ${escapeHtml(w.weekLabel)} ${isCurrent ? '<span class="pill pill-primary" style="font-size:0.68rem;">Seleccionada</span>' : ''}
            </td>
            <td style="color:var(--text-muted);font-size:0.78rem;">${w.startDate} al ${w.endDate}</td>
            <td><strong>${fmtNum(w.totalShifts, 0)}</strong> req</td>
            <td><span class="pill ${attColor}">${fmtPct(w.attendancePct)}</span></td>
            <td><span class="pill ${canColor}">${fmtPct(w.cancellationPct)}</span></td>
            <td><span class="pill ${covColor}">${fmtPct(w.cuposCoveragePct)}</span></td>
            <td>${fmtPct(w.punctualityPct)}</td>
            <td><strong>${fmtNum(w.totalPackages, 0)}</strong> paqs</td>
            <td>${w.productivity ? w.productivity.toFixed(2) + ' paq/h' : '—'}</td>
            <td>
              <button class="btn btn-secondary" onclick="selectWeekForAnalysis('${w.weekKey}', '${w.startDate}', '${w.endDate}')"
                style="padding:4px 10px;font-size:0.75rem;">
                🔍 Inspeccionar
              </button>
            </td>
          </tr>
        `;
      }).join('');
      restoreTableSort(tableSummaryEl.closest('table'));
    }
  }
}

// Función global para seleccionar semana desde la tabla de semanas pasadas
function selectWeekForAnalysis(weekKey, startDate, endDate) {
  AppState.selectedModulo3Week = weekKey;
  // Actualizar filtro global de fechas para que toda la aplicación responda a esa semana
  if (document.getElementById('filterFrom')) document.getElementById('filterFrom').value = startDate;
  if (document.getElementById('filterTo')) document.getElementById('filterTo').value = endDate;
  if (document.getElementById('filterFromPicker')) document.getElementById('filterFromPicker').value = startDate;
  if (document.getElementById('filterToPicker')) document.getElementById('filterToPicker').value = endDate;
  if (document.getElementById('filterSemana')) {
    document.getElementById('filterSemana').value = `${startDate}:${endDate}`;
  }
  applyFilters();
  renderModulo3Visuals();
}

// ============================================================
// MÓDULO DE RANKINGS DE FLOTA CRÍTICA / BAJO RENDIMIENTO
// Componente 1: Top 5 Peores por Tienda
// Componente 2: Escalafón Global Top 10 con Más Cancelaciones
// Componente 3: Exportación a CSV
// ============================================================
function renderFlotaCriticaModule() {
  const shifts = AppState.filteredMalla;
  if (!shifts || typeof RankingFlotaCriticaEngine === 'undefined') return;

  const stores = RankingFlotaCriticaEngine.getStoresList(shifts);
  const storeSelect = document.getElementById('rankingStoreSelect');

  // Si hay filtro global de tienda activo, usarlo; de lo contrario mantener la selección o la primera tienda
  const globalStore = document.getElementById('filterStore')?.value || '';
  if (globalStore && stores.includes(globalStore)) {
    AppState.selectedRankingStore = globalStore;
  } else if (!AppState.selectedRankingStore || !stores.includes(AppState.selectedRankingStore)) {
    AppState.selectedRankingStore = stores[0] || '';
  }

  if (storeSelect) {
    storeSelect.innerHTML = stores.length > 0
      ? stores.map(s => `<option value="${escapeHtml(s)}" ${s === AppState.selectedRankingStore ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')
      : '<option value="">Sin tiendas disponibles</option>';
    if (AppState.selectedRankingStore) storeSelect.value = AppState.selectedRankingStore;
  }

  // Mini Tarjetas de Diagnóstico Crítico
  const allPilots = RankingFlotaCriticaEngine.getPilotsSummary(shifts);
  const withCancels = allPilots.filter(p => p.cancels > 0);
  const totalCancels = withCancels.reduce((sum, p) => sum + p.cancels, 0);

  // Calcular la tienda con mayor cantidad de cancelaciones
  const storeCancelsMap = {};
  shifts.forEach(s => {
    const rawSt = (s.status || '').toLowerCase().trim();
    const isExcluded = (
      rawSt.includes('tienda cerrada') ||
      rawSt === 'cerrada' ||
      rawSt.includes('adicional no autoriz') ||
      rawSt.includes('no autorizado') ||
      rawSt.includes('cliente cancela') ||
      rawSt.includes('cancela cliente') ||
      rawSt.includes('adicional cancel') ||
      rawSt.includes('no programado')
    );
    const isPilotCancel = !isExcluded && Boolean(
      s.pilot_cancel ||
      rawSt === 'piloto cancela' ||
      rawSt === 'cancela piloto' ||
      rawSt === 'piloto canceló' ||
      rawSt === 'piloto cancelo' ||
      (rawSt.includes('piloto') && rawSt.includes('cancel'))
    );
    if (isPilotCancel) {
      const st = s.store || 'Sin Tienda';
      storeCancelsMap[st] = (storeCancelsMap[st] || 0) + 1;
    }
  });

  let topStoreName = '—';
  let topStoreMax = 0;
  Object.entries(storeCancelsMap).forEach(([st, count]) => {
    if (count > topStoreMax) {
      topStoreMax = count;
      topStoreName = st;
    }
  });

  const kpiPilotsCountEl = document.getElementById('kpiCriticalPilotsCount');
  const kpiTotalCancelsEl = document.getElementById('kpiCriticalTotalCancels');
  const kpiTopStoreEl = document.getElementById('kpiCriticalTopStore');
  const kpiTopStoreSubEl = document.getElementById('kpiCriticalTopStoreSub');

  if (kpiPilotsCountEl) kpiPilotsCountEl.innerText = fmtNum(withCancels.length, 0);
  if (kpiTotalCancelsEl) kpiTotalCancelsEl.innerText = fmtNum(totalCancels, 0);
  if (kpiTopStoreEl) kpiTopStoreEl.innerText = topStoreName.length > 20 ? topStoreName.substring(0, 19) + '…' : topStoreName;
  if (kpiTopStoreSubEl) kpiTopStoreSubEl.innerText = topStoreMax > 0 ? `${topStoreMax} cancelaciones registradas` : 'Sin cancelaciones';

  // Renderizar componentes
  renderTop3StoresCards();
  renderTop5StoreTable();
  renderTop10GlobalTable();
}

function renderTop3StoresCards() {
  const container = document.getElementById('top3StoresContainer');
  if (!container || typeof RankingFlotaCriticaEngine === 'undefined') return;

  const top3 = RankingFlotaCriticaEngine.getTop3StoresByCancels(AppState.filteredMalla);

  if (top3.length === 0 || top3.every(s => s.cancels === 0)) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 24px; color: var(--text-dim); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
        ✅ No se registraron cancelaciones en ninguna tienda dentro del rango de filtros activo.
      </div>
    `;
    return;
  }

  const medals = ['🥇 Top 1', '🥈 Top 2', '🥉 Top 3'];
  const cardStyles = [
    'border: 1px solid rgba(239, 68, 68, 0.45); background: linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, rgba(26, 22, 45, 0.6) 100%);',
    'border: 1px solid rgba(245, 158, 11, 0.4); background: linear-gradient(180deg, rgba(245, 158, 11, 0.10) 0%, rgba(26, 22, 45, 0.6) 100%);',
    'border: 1px solid rgba(139, 92, 246, 0.35); background: linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(26, 22, 45, 0.6) 100%);'
  ];

  container.innerHTML = top3.map((st, idx) => {
    const isSelected = AppState.selectedRankingStore === st.store;
    const badgeMedal = medals[idx] || `#${idx + 1}`;
    const badgeClass = idx === 0 ? 'pill-bad' : (idx === 1 ? 'pill-warn' : 'pill-primary');

    return `
      <div class="section-panel" style="${cardStyles[idx] || ''} margin-bottom: 0; position: relative; padding: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <span class="pill ${badgeClass}" style="font-weight: 800; font-size: 0.78rem;">
            ${badgeMedal}
          </span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">
            Ciudad: <strong style="color: var(--text-main);">${escapeHtml(st.city)}</strong>
          </span>
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin: 0 0 4px 0;">
          ${escapeHtml(st.store)}
        </h3>

        <div style="display: flex; align-items: baseline; gap: 8px; margin: 12px 0 6px 0;">
          <span style="font-size: 2rem; font-weight: 900; color: var(--color-danger, #ef4444); line-height: 1;">
            ${st.cancels}
          </span>
          <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
            cancelaciones registradas
          </span>
        </div>

        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">
          ${st.matchedCancels ? `<span style="color:#10b981;">✓ ${st.matchedCancels} cubiertas con reemplazo</span> · ` : ''}
          <span style="color:#ef4444;">⚠ ${st.unmatchedCancels || (st.cancels - (st.matchedCancels || 0))} sin reemplazo</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 0.78rem;">
          <div>
            <div style="color: var(--text-muted);">Tasa Cancelación</div>
            <strong style="color: ${st.cancelRatePct >= 10 ? 'var(--color-danger, #ef4444)' : 'var(--color-warning, #f59e0b)'}; font-size: 0.95rem;">
              ${st.cancelRatePct}%
            </strong>
            <span style="color: var(--text-muted); font-size: 0.72rem;">de ${st.totalShifts} turnos</span>
          </div>

          <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'}" onclick="auditStoreInTop5(decodeURIComponent('${encodeURIComponent(st.store || '')}'))" style="padding: 6px 12px; font-size: 0.75rem;">
            ${isSelected ? '✓ Tienda Activa' : '🔍 Auditar en Top 5'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function auditStoreInTop5(storeName) {
  AppState.selectedRankingStore = storeName;
  const sel = document.getElementById('rankingStoreSelect');
  if (sel) sel.value = storeName;
  renderTop3StoresCards();
  renderTop5StoreTable();

  const top5Sec = document.getElementById('tableTop5Store');
  if (top5Sec) {
    top5Sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function renderTop5StoreTable() {
  const tableBody = document.getElementById('tableTop5Store');
  if (!tableBody) return;

  const currentStore = AppState.selectedRankingStore || document.getElementById('rankingStoreSelect')?.value || '';
  if (!currentStore) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-dim);">Selecciona una tienda para visualizar el Top 5 de pilotos con menor rendimiento.</td></tr>`;
    return;
  }

  const top5 = RankingFlotaCriticaEngine.getTop5ByStore(AppState.filteredMalla, currentStore);

  if (top5.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center;padding:24px;color:var(--text-dim);">
          ✅ No se detectaron pilotos críticos con ≥1 turno programado en <strong>${escapeHtml(currentStore)}</strong> dentro del periodo seleccionado.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = top5.map((p, idx) => {
    const pos = idx + 1;
    const posBadge = pos === 1
      ? '<span class="pill pill-bad" style="font-weight:700;">#1 Crítico</span>'
      : `<span style="font-weight:700;color:var(--text-muted);">#${pos}</span>`;

    const prodColor = p.prodPct >= 95 ? 'badge-optimo' : (p.prodPct >= 85 ? 'badge-aceptable' : 'badge-bajo');
    const cancelBadge = p.cancels > 0
      ? `<span class="pill pill-bad" style="font-weight:700;">${p.cancels} canc</span>`
      : `<span style="color:var(--text-muted);">0</span>`;

    return `
      <tr>
        <td style="text-align:center;">${posBadge}</td>
        <td>
          <div style="font-weight:700;color:#fff;">${escapeHtml(p.pilot)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">ID: ${escapeHtml(p.pilot_id)} · Tel: ${escapeHtml(p.phone)}</div>
        </td>
        <td><span class="pill pill-neutral">${escapeHtml(currentStore)}</span></td>
        <td style="text-align:center;">${cancelBadge}</td>
        <td style="text-align:center;"><strong>${p.attendedCount}</strong> de ${p.totalShifts}</td>
        <td style="text-align:center;">
          <span class="pill ${prodColor}">${p.prodPct}%</span>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">${p.prodPaqH} paq/h (meta ${p.avgTargetPaqH})</div>
        </td>
        <td style="text-align:center;">
          <div style="font-weight:700;color:${p.riskScore >= 70 ? 'var(--color-danger, #ef4444)' : 'var(--color-warning, #f59e0b)'};">
            ${p.riskScore} / 100
          </div>
        </td>
        <td style="text-align:center;">
          <span class="pill ${p.statusTag.class}">${escapeHtml(p.statusTag.label)}</span>
        </td>
        <td style="text-align:center;">
          <div style="display:flex;gap:4px;justify-content:center;align-items:center;">
            <button class="btn btn-secondary" onclick="viewPilotProfileDirect(decodeURIComponent('${encodeURIComponent(p.pilot || '')}'))" style="padding:4px 8px;font-size:0.75rem;" title="Ver Ficha 360°">
              👤 360°
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openLlamadoModalFromRanking(${idx}, 'store')" style="padding:4px 8px;font-size:0.75rem;border-color:rgba(239,68,68,0.4);color:#fca5a5;" title="Enviar Llamado de Atención por WhatsApp">
              💬 Llamado
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  restoreTableSort(tableBody?.closest('table'));
}

function renderTop10GlobalTable() {
  const tableBody = document.getElementById('tableTop10Global');
  if (!tableBody) return;

  const fleetRanking = RankingFlotaCriticaEngine.getGlobalTop10Cancels(AppState.filteredMalla);

  const subtitleEl = document.getElementById('globalFleetSubtitle');
  if (subtitleEl) {
    subtitleEl.innerText = `Ranking consolidado de toda la flota (${fleetRanking.length} pilotos evaluados con ≥1 turno en el periodo)`;
  }

  if (fleetRanking.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center;padding:24px;color:var(--text-dim);">
          ✅ No se encontraron pilotos con al menos 1 turno programado en el periodo filtrado.
        </td>
      </tr>
    `;
    return;
  }

  const medals = ['🥇 #1', '🥈 #2', '🥉 #3'];

  tableBody.innerHTML = fleetRanking.map((p, idx) => {
    const posLabel = idx < 3 ? medals[idx] : `#${idx + 1}`;
    const rankClass = p.cancels >= 3 ? 'pill-bad' : (p.cancels >= 1 ? 'pill-warn' : (p.attendedCount > 0 ? 'pill-good' : 'pill-neutral'));

    return `
      <tr>
        <td style="text-align:center;">
          <span class="pill ${rankClass}" style="font-weight:700;">${posLabel}</span>
        </td>
        <td>
          <div style="font-weight:700;color:#fff;">${escapeHtml(p.pilot)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">ID: ${escapeHtml(p.pilot_id)} · Ciudad: ${escapeHtml(p.city)}</div>
        </td>
        <td>
          <div style="font-size:0.8rem;color:var(--text-main);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(p.storesLabel)}">
            ${escapeHtml(p.storesLabel)}
          </div>
        </td>
        <td style="text-align:center;">
          <span class="pill ${p.cancels > 0 ? 'pill-bad' : 'pill-good'}" style="font-weight:800;font-size:0.85rem;">
            ${p.cancels} cancela${p.cancels === 1 ? 'ción' : 'ciones'}
          </span>
        </td>
        <td style="text-align:center;"><strong>${p.totalShifts}</strong> turnos</td>
        <td style="text-align:center;">
          <span class="pill ${p.cancelImpactPct >= 40 ? 'badge-bajo' : (p.cancelImpactPct > 0 ? 'badge-aceptable' : 'pill-good')}">
            ${p.cancelImpactPct}%
          </span>
        </td>
        <td style="text-align:center;">
          <strong>${p.prodPaqH}</strong> paq/h
          <div style="font-size:0.72rem;color:var(--text-muted);">${p.prodPct}% meta</div>
        </td>
        <td style="text-align:center;">
          <span style="font-weight:700;color:${p.riskScore >= 70 ? 'var(--color-danger, #ef4444)' : (p.riskScore >= 40 ? 'var(--color-warning, #f59e0b)' : 'var(--emerald, #10b981)')};">
            ${p.riskScore}
          </span>
        </td>
        <td style="text-align:center;">
          <span class="pill ${p.suggestedAction.colorClass}" style="font-weight:600;">
            ${escapeHtml(p.suggestedAction.label)}
          </span>
        </td>
        <td style="text-align:center;">
          <div style="display:flex;gap:4px;justify-content:center;align-items:center;">
            <button class="btn btn-secondary" onclick="viewPilotProfileDirect(decodeURIComponent('${encodeURIComponent(p.pilot || '')}'))" style="padding:4px 8px;font-size:0.75rem;" title="Ver Ficha 360°">
              🔍 360°
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openLlamadoModalFromRanking(${idx}, 'global')" style="padding:4px 8px;font-size:0.75rem;border-color:rgba(239,68,68,0.4);color:#fca5a5;" title="Enviar Llamado de Atención por WhatsApp">
              💬 Llamado
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  restoreTableSort(tableBody.closest('table'));
}

function viewPilotProfileDirect(pilotName) {
  switchTab('pilotos');
  selectPilotForProfile(pilotName);
}

function exportCriticalRankingCsv() {
  const shifts = AppState.filteredMalla;
  if (!shifts || typeof RankingFlotaCriticaEngine === 'undefined') return;

  const currentStore = AppState.selectedRankingStore || document.getElementById('rankingStoreSelect')?.value || '';
  const globalTop10 = RankingFlotaCriticaEngine.getGlobalTop10Cancels(shifts);
  const storeTop5 = RankingFlotaCriticaEngine.getTop5ByStore(shifts, currentStore);

  const from = document.getElementById('filterFrom')?.value || 'Inicio';
  const to = document.getElementById('filterTo')?.value || 'Hoy';
  const city = document.getElementById('filterCity')?.value || 'Todas las ciudades';

  let csv = '\uFEFF'; // BOM para que Excel en Windows abra correctamente UTF-8 con acentos
  csv += 'REPORTE OFICIAL DE FLOTA CRITICA Y BAJO RENDIMIENTO - TADA / PIBOX\r\n';
  csv += `Periodo: ${from} al ${to} | Ciudad: ${city} | Filtro minimo: 1 turno programado\r\n`;
  csv += `Generado el: ${new Date().toLocaleString('es-CO')}\r\n\r\n`;

  // SECCION 1: TOP 3 TIENDAS CON MAYOR CANCELACION
  const top3Stores = RankingFlotaCriticaEngine.getTop3StoresByCancels(shifts);
  csv += '--- TOP 3 TIENDAS CON MAYOR CONCENTRACION DE CANCELACIONES ---\r\n';
  csv += 'Posicion,Tienda,Ciudad,Total Cancelaciones,Cancelaciones sin Reemplazo (Faltantes),Cancelaciones Cubiertas con Reemplazo,Total Turnos,Tasa Cancelacion (%)\r\n';
  top3Stores.forEach((st, idx) => {
    csv += `${idx + 1},"${st.store.replace(/"/g, '""')}","${st.city.replace(/"/g, '""')}",${st.cancels},${st.unmatchedCancels},${st.matchedCancels},${st.totalShifts},${st.cancelRatePct}%\r\n`;
  });
  csv += '\r\n';

  // SECCION 2: ESCALAFON GLOBAL DE LA FLOTA (RANKING TOTAL)
  csv += '--- ESCALAFON GLOBAL DE LA FLOTA (RANKING TOTAL) ---\r\n';
  csv += 'Ranking,Piloto,ID,Telefono,Ciudad,Tiendas donde Opera,Total Cancelaciones,Turnos Programados,% Cancelacion,Prod Real (paq/h),% Productividad vs Meta,Score Riesgo,Accion Sugerida\r\n';

  if (globalTop10.length === 0) {
    csv += 'No se registraron pilotos con cancelaciones (minimo 1 turno programado) en el periodo filtrado.\r\n';
  } else {
    globalTop10.forEach((p, idx) => {
      const storesEscaped = `"${p.storesLabel.replace(/"/g, '""')}"`;
      const pilotEscaped = `"${p.pilot.replace(/"/g, '""')}"`;
      csv += `${idx + 1},${pilotEscaped},${p.pilot_id},${p.phone},${p.city},${storesEscaped},${p.cancels},${p.totalShifts},${p.cancelImpactPct}%,${p.prodPaqH},${p.prodPct}%,${p.riskScore},"${p.suggestedAction.label}"\r\n`;
    });
  }

  csv += '\r\n';

  // SECCION 3: TOP 5 PEORES POR TIENDA
  csv += `--- TOP 5 PEORES PILOTOS POR TIENDA: ${currentStore || 'Sin Tienda'} ---\r\n`;
  csv += 'Posicion,Piloto,ID,Telefono,Tienda,N Cancelaciones,Turnos Realizados,% Productividad vs Meta,Prod Real (paq/h),Score Riesgo,Status Operativo\r\n';

  if (storeTop5.length === 0) {
    csv += `No se encontraron pilotos con suficiente historial (minimo 1 turno) en la tienda ${currentStore}.\r\n`;
  } else {
    storeTop5.forEach((p, idx) => {
      const pilotEscaped = `"${p.pilot.replace(/"/g, '""')}"`;
      csv += `${idx + 1},${pilotEscaped},${p.pilot_id},${p.phone},${currentStore},${p.cancels},${p.attendedCount},${p.prodPct}%,${p.prodPaqH},${p.riskScore},"${p.statusTag.label}"\r\n`;
    });
  }

  // Descarga automática en el navegador
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Reporte_Flota_Critica_TaDa_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// MODAL DE SUPLENTES (POOL DE DISPONIBLES CON 3 CRITERIOS)
// ============================================================
function setupSuplentesModal() {
  const modal = document.getElementById('modalSuplentes');
  const btnClose = document.getElementById('btnCloseSuplentes');
  if (btnClose) btnClose.addEventListener('click', () => modal.classList.remove('active'));
}

function openSuplentesModalForShift(shiftIndex) {
  const evaluatedShifts = CoverageEngine.evaluateScheduledShiftsRisk(
    AppState.filteredProg,
    AppState.mallaShifts,
    APP_CONFIG
  );
  evaluatedShifts.sort((a, b) => {
    const order = { vacant: 1, high: 2, medium: 3, low: 4, unknown: 5 };
    return (order[a.risk.level] || 9) - (order[b.risk.level] || 9);
  });

  const shift = evaluatedShifts[shiftIndex];
  if (!shift) return;

  renderSuplentesList(shift);
}

function openSuplentesModalForStore(storeName) {
  const shift = AppState.progShifts.find(s => s.store === storeName && s.is_vacant) ||
                AppState.progShifts.find(s => s.store === storeName) ||
                { store: storeName, city: '', weekday: 'Sabado', start: 540 };
  renderSuplentesList(shift);
}

function renderSuplentesList(targetShift) {
  AppState.targetShiftForSuplente = targetShift;
  const modal = document.getElementById('modalSuplentes');
  const titleEl = document.getElementById('suplentesModalTitle');
  const listEl = document.getElementById('suplentesListContainer');

  if (titleEl) {
    titleEl.innerHTML = `
      Sugerencias de Suplente para: <strong>${escapeHtml(targetShift.store)}</strong><br>
      <span style="font-size:0.8rem;color:var(--text-muted);">${targetShift.weekday || ''} ${targetShift.date || ''} a las ${fmtMinutes(targetShift.start)}</span>
    `;
  }

  // Aplicar motor con los 3 criterios y validación de conflicto de horarios
  const candidates = CoverageEngine.suggestReplacements(
    targetShift,
    AppState.mallaShifts,
    AppState.progShifts
  );

  if (!listEl) return;

  if (candidates.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-dim);">No se encontraron suplentes disponibles sin conflicto de horario en esa fecha.</div>`;
  } else {
    listEl.innerHTML = candidates.map(c => {
      const cleanPhone = (c.phone || '').replace(/\D/g, '');
      const waLink = cleanPhone ? `https://wa.me/57${cleanPhone}?text=Hola%20${encodeURIComponent(c.name)},%20te%20escribimos%20de%20operaciones%20TaDa/Pibox%20para%20confirmar%20tu%20disponibilidad%20el%20turno%20en%20${encodeURIComponent(targetShift.store)}` : null;
      const safeName = escapeHtml(c.name).replace(/'/g, "\\'");
      const safeId = escapeHtml(c.pilot_id || '').replace(/'/g, "\\'");
      const safeTel = escapeHtml(c.phone || '').replace(/'/g, "\\'");

      return `
        <div class="suplente-card" style="border: 1px solid rgba(139, 92, 246, 0.22); border-radius: var(--radius-md); padding: 14px; margin-bottom: 12px; background: rgba(20, 24, 54, 0.7); display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 220px;">
            <div style="font-weight:700;color:#fff;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
              <span>${escapeHtml(c.name)}</span>
              ${c.pilot_id ? `<span style="font-size:0.7rem;color:var(--text-dim);font-weight:normal;">(ID: ${escapeHtml(c.pilot_id)})</span>` : ''}
            </div>
            <div class="suplente-meta" style="display:flex;gap:10px;flex-wrap:wrap;font-size:0.77rem;color:var(--text-muted);margin-top:4px;">
              <span>🏪 ${escapeHtml(c.storeInfo)}</span>
              <span>📅 ${escapeHtml(c.dayInfo)}</span>
              <span>🛡️ Asistencia: <strong>${c.globalAssistPct}%</strong></span>
            </div>
            ${c.sameDayNote ? `<div style="font-size:0.73rem;color:#fbbf24;margin-top:4px;">ℹ️ ${escapeHtml(c.sameDayNote)}</div>` : ''}
          </div>
          <div style="text-align:right;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div style="text-align:right;margin-right:4px;">
              <div style="font-size:1.18rem;font-weight:800;color:#10b981;">${c.fitScore} pts</div>
              <div style="font-size:0.68rem;color:var(--text-dim);">Afinidad 3 Criterios</div>
            </div>
            ${waLink ? `<a href="${waLink}" target="_blank" class="btn btn-whatsapp btn-sm" title="Contactar por WhatsApp">💬 WhatsApp</a>` : ''}
            <button type="button" class="btn btn-primary btn-sm" onclick="assignCandidateToShift('${safeName}', '${safeId}', '${safeTel}')" title="Asignar a este conductor para cubrir el turno">
              ✅ Asignar
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  if (modal) modal.classList.add('active');
}

/**
 * Confirma la asignación de un piloto al turno objetivo con validación final en tiempo real
 */
async function assignCandidateToShift(pilotName, pilotId, phone) {
  const targetShift = AppState.targetShiftForSuplente;
  if (!targetShift) {
    alert('No se encontró el turno objetivo para asignar.');
    return;
  }

  // Validación final obligatoria antes de confirmar asignación
  const validation = CoverageEngine.validatePilotAvailability(
    { name: pilotName, pilot_id: pilotId },
    targetShift,
    AppState.progShifts
  );

  if (!validation.available) {
    alert(`⚠️ Asignación Rechazada por Conflicto:\n\n${validation.reason}\n\nEl sistema ha protegido la programación para evitar asignaciones incompatibles o simultáneas.`);
    return;
  }

  // Aplicar asignación
  targetShift.pilot = pilotName;
  targetShift.pilot_id = pilotId || targetShift.pilot_id || '';
  targetShift.phone = phone || targetShift.phone || '';
  targetShift.is_vacant = false;
  targetShift.status = 'Reemplazo';

  // Persistir en IndexedDB local
  try {
    if (typeof TaDaDB !== 'undefined' && TaDaDB.saveProgramacionShifts) {
      await TaDaDB.saveProgramacionShifts(AppState.progShifts);
    }
  } catch(e) {
    console.warn('[TaDa] Error persistiendo turno asignado en DB:', e);
  }

  // Refrescar indicadores y vistas
  renderModulo2Coverage();
  renderKpis();
  updateTabBadges();

  // Cerrar modal
  const modal = document.getElementById('modalSuplentes');
  if (modal) modal.classList.remove('active');

  alert(`✅ Asignación Exitosa:\n\n${pilotName} ha sido asignado como reemplazo para ${targetShift.store} (${fmtMinutes(targetShift.start)}).`);
}

/**
 * Libera o cancela la asignación de un turno programado, actualizando la disponibilidad del conductor
 */
async function cancelOrReleaseShift(shiftIndex) {
  const evaluatedShifts = CoverageEngine.evaluateScheduledShiftsRisk(
    AppState.filteredProg,
    AppState.mallaShifts,
    APP_CONFIG
  );
  evaluatedShifts.sort((a, b) => {
    const order = { vacant: 1, high: 2, medium: 3, low: 4, unknown: 5 };
    return (order[a.risk.level] || 9) - (order[b.risk.level] || 9);
  });

  const shift = evaluatedShifts[shiftIndex];
  if (!shift) return;

  const confirmMsg = confirm(`¿Deseas liberar la asignación de ${shift.pilot} en ${shift.store}?\n\nEl turno quedará marcado como vacante y el conductor quedará disponible inmediatamente para otras asignaciones sin cruce.`);
  if (!confirmMsg) return;

  shift.status = 'Piloto Cancela';
  shift.is_vacant = true;
  shift.pilot = '[SIN ASIGNAR]';

  try {
    if (typeof TaDaDB !== 'undefined' && TaDaDB.saveProgramacionShifts) {
      await TaDaDB.saveProgramacionShifts(AppState.progShifts);
    }
  } catch(e) {
    console.warn('[TaDa] Error persistiendo liberación en DB:', e);
  }

  renderModulo2Coverage();
  renderKpis();
  updateTabBadges();
}

// ============================================================
// MODAL: LLAMADO DE ATENCIÓN VÍA WHATSAPP (Flota Crítica)
// ============================================================
let _currentLlamadoData = null;

function openLlamadoModal(pilotData, type = 'cancelaciones') {
  if (!pilotData) return;
  _currentLlamadoData = { ...pilotData, type };

  const modal = document.getElementById('modalLlamadoAtencion');
  if (!modal) return;

  // Determinar semana evaluada para la plantilla
  let semanaEvaluada = '';
  if (AppState.selectedModulo3Week && AppState.availableWeeks) {
    const w = AppState.availableWeeks.find(wk => wk.weekKey === AppState.selectedModulo3Week);
    if (w) semanaEvaluada = `${w.startDate} al ${w.endDate}`;
  }
  if (!semanaEvaluada) {
    const fromVal = document.getElementById('filterFrom')?.value || '';
    const toVal = document.getElementById('filterTo')?.value || '';
    if (fromVal && toVal) {
      semanaEvaluada = `${fromVal} al ${toVal}`;
    } else {
      semanaEvaluada = 'recientemente evaluada';
    }
  }

  const pilotName = pilotData.pilot || pilotData.name || 'Conductor';
  const stores = pilotData.storesLabel || pilotData.store || 'Tienda asignada';

  // Construir mensaje oficial según motivo
  let msg = '';
  if (type === 'cancelaciones') {
    msg = `⚠️ ¡Aviso importante!\n\n` +
      `Hola, *${pilotName}* 👋\n\n` +
      `Al revisar la semana *${semanaEvaluada}*, evidenciamos varias cancelaciones de turnos programados.\n\n` +
      `Es importante que, cuando aceptes un turno, tengas la seguridad de poder asistir, ya que la programación se realiza con anticipación y las cancelaciones de último momento generan inconvenientes para la tienda y la operación.\n\n` +
      `📌 Actualmente estamos realizando un seguimiento semanal a las cancelaciones y a la productividad de los pilotos. Si acumulas tres avisos, se validará tu situación con la tienda antes de realizar nuevas asignaciones.\n\n` +
      `Agradecemos tu compromiso y responsabilidad con los turnos programados. 🏍️🟪`;
  } else {
    const prodPaqH = pilotData.prodPaqH != null ? pilotData.prodPaqH : '0.00';
    const prodPct = pilotData.prodPct != null ? pilotData.prodPct : '0';
    const target = pilotData.avgTargetPaqH != null ? pilotData.avgTargetPaqH : '1.50';

    msg = `📊 Seguimiento Operativo - Productividad\n\n` +
      `Hola, *${pilotName}* 👋\n\n` +
      `Al revisar tu desempeño durante la semana *${semanaEvaluada}*, observamos que tu productividad promedio fue de *${prodPaqH} paq/h*, alcanzando un *${prodPct}%* respecto a la meta establecida (*${target} paq/h*).\n\n` +
      `Te escribimos con el fin de acompañarte y entender si has presentado algún inconveniente en ruta o en tienda para ayudarte a alcanzar la meta operativa. Tu labor es clave para garantizar el nivel de servicio a nuestros clientes.\n\n` +
      `📌 Actualmente realizamos seguimiento semanal a los indicadores operativos. Te invitamos a reforzar el ritmo de entregas en tus próximos turnos programados.\n\n` +
      `¡Contamos con tu compromiso y dedicación! 🏍️📦`;
  }

  // Llenar campos en el modal
  const nameEl = document.getElementById('llamadoPilotName');
  if (nameEl) nameEl.innerText = pilotName;

  const phoneEl = document.getElementById('llamadoPilotPhone');
  if (phoneEl) phoneEl.innerText = pilotData.phone ? pilotData.phone : 'Sin teléfono registrado';

  const storeEl = document.getElementById('llamadoPilotStore');
  if (storeEl) storeEl.innerText = stores;

  const badgeEl = document.getElementById('llamadoTipoBadge');
  if (badgeEl) {
    badgeEl.innerHTML = type === 'cancelaciones'
      ? `<span class="pill pill-bad" style="font-weight:700;font-size:0.8rem;">⚠️ Motivo: Cancelaciones Reiteradas</span>`
      : `<span class="pill pill-warn" style="font-weight:700;font-size:0.8rem;">📊 Motivo: Baja Productividad (Bajo Meta)</span>`;
  }

  const previewEl = document.getElementById('llamadoMensajePreview');
  if (previewEl) previewEl.value = msg;

  modal.style.display = 'flex';
}

function closeLlamadoModal() {
  const modal = document.getElementById('modalLlamadoAtencion');
  if (modal) modal.style.display = 'none';
  _currentLlamadoData = null;
}

function abrirWhatsAppLlamado() {
  if (!_currentLlamadoData) return;
  let rawPhone = (_currentLlamadoData.phone || '').replace(/\D/g, '');
  if (rawPhone.length === 10 && rawPhone.startsWith('3')) {
    rawPhone = '57' + rawPhone;
  }
  const previewEl = document.getElementById('llamadoMensajePreview');
  const msg = previewEl ? previewEl.value : '';

  if (!rawPhone) {
    alert('⚠️ Este piloto no cuenta con un número de teléfono válido registrado en la base de datos. Puedes copiar el mensaje y contactarlo manualmente.');
    return;
  }

  const url = `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function copiarMensajeLlamado() {
  const previewEl = document.getElementById('llamadoMensajePreview');
  const msg = previewEl ? previewEl.value : '';
  if (!msg) return;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).then(() => {
      alert('📋 ¡Mensaje copiado al portapapeles exitosamente!');
    }).catch(() => {
      prompt('Copia manualmente este mensaje:', msg);
    });
  } else {
    prompt('Copia manualmente este mensaje:', msg);
  }
}

function openLlamadoModalFromRanking(index, source) {
  const shifts = AppState.filteredMalla;
  let pilot = null;

  if (source === 'store') {
    const currentStore = AppState.selectedRankingStore || document.getElementById('rankingStoreSelect')?.value || '';
    const top5 = RankingFlotaCriticaEngine.getTop5ByStore(shifts, currentStore);
    pilot = top5[index];
  } else if (source === 'global') {
    const top10 = RankingFlotaCriticaEngine.getGlobalTop10Cancels(shifts);
    pilot = top10[index];
  }

  if (!pilot) {
    alert('No se pudo encontrar el piloto seleccionado.');
    return;
  }

  const type = (pilot.cancels && pilot.cancels > 0) ? 'cancelaciones' : 'productividad';
  openLlamadoModal(pilot, type);
}

// ============================================================
// FICHA 360° DEL PILOTO
// ============================================================
function selectPilotForProfile(pilotIdentifier) {
  if (!pilotIdentifier) return;
  const cleanId = String(pilotIdentifier).trim().toLowerCase();
  let pilotData = AppState.pilotsList.find(p =>
    (p.pilot && p.pilot.toLowerCase() === cleanId) ||
    (p.pilot_id && p.pilot_id.toLowerCase() === cleanId)
  );

  // Fallback si no está en AppState.pilotsList: buscar directamente en AppState.mallaShifts
  if (!pilotData && AppState.mallaShifts && AppState.mallaShifts.length > 0) {
    const matchedShifts = AppState.mallaShifts.filter(s =>
      (s.pilot && s.pilot.toLowerCase() === cleanId) ||
      (s.pilot_id && s.pilot_id.toLowerCase() === cleanId)
    );
    if (matchedShifts.length > 0) {
      matchedShifts.forEach(s => {
        if (s.evaluable === undefined || s.attended === undefined || s.pilot_cancel === undefined) {
          const cls = typeof classifyShiftStatus === 'function' ? classifyShiftStatus(s.status) : null;
          if (cls) {
            if (s.evaluable === undefined) s.evaluable = cls.evaluable;
            if (s.attended === undefined) s.attended = cls.attended;
            if (s.pilot_cancel === undefined) s.pilot_cancel = cls.pilotCancel;
            if (s.excluded === undefined) s.excluded = cls.excluded;
          }
        }
      });
      const metrics = aggregateShiftMetrics(matchedShifts, APP_CONFIG);
      const reliability = calculateReliabilityScore(metrics, APP_CONFIG);
      const first = matchedShifts[0] || {};
      pilotData = {
        pilot: first.pilot || pilotIdentifier,
        pilot_id: first.pilot_id || '—',
        phone: first.phone || '—',
        city: first.city || '—',
        mainStore: first.store || '—',
        shifts: matchedShifts,
        metrics,
        reliability,
        recommendation: reliability
      };
      AppState.pilotsList.push(pilotData);
    }
  }

  if (!pilotData) return;

  AppState.selectedPilot = pilotData;

  // Si el score viene nulo pero el piloto tiene turnos registrados, reevaluar con normalización
  if ((!pilotData.reliability || pilotData.reliability.score == null) && pilotData.shifts && pilotData.shifts.length > 0) {
    pilotData.shifts.forEach(s => {
      if (s.evaluable === undefined || s.attended === undefined || s.pilot_cancel === undefined) {
        const cls = typeof classifyShiftStatus === 'function' ? classifyShiftStatus(s.status) : null;
        if (cls) {
          if (s.evaluable === undefined) s.evaluable = cls.evaluable;
          if (s.attended === undefined) s.attended = cls.attended;
          if (s.pilot_cancel === undefined) s.pilot_cancel = cls.pilotCancel;
          if (s.excluded === undefined) s.excluded = cls.excluded;
        }
      }
    });
    pilotData.metrics = aggregateShiftMetrics(pilotData.shifts, APP_CONFIG);
    pilotData.reliability = calculateReliabilityScore(pilotData.metrics, APP_CONFIG);
    pilotData.recommendation = pilotData.reliability;
  }

  const nameEl = document.getElementById('profilePilotName');
  const metaEl = document.getElementById('profilePilotMeta');
  const avatarEl = document.getElementById('profileAvatarLetter');
  const scoreEl = document.getElementById('profileScoreValue');
  const recBadgeEl = document.getElementById('profileRecBadge');
  const recDescEl = document.getElementById('profileRecDesc');

  if (nameEl) nameEl.innerText = pilotData.pilot;
  if (metaEl) metaEl.innerText = `ID: ${pilotData.pilot_id} · Tel: ${pilotData.phone} · Ciudad: ${pilotData.city} · Tienda: ${pilotData.mainStore}`;
  if (avatarEl) avatarEl.innerText = (pilotData.pilot || 'P').charAt(0).toUpperCase();

  const score = pilotData.reliability.score != null ? pilotData.reliability.score : '—';
  if (scoreEl) scoreEl.innerHTML = `${score} <span>/100</span>`;

  if (recBadgeEl) {
    recBadgeEl.className = `pill ${pilotData.recommendation.badgeClass}`;
    recBadgeEl.innerText = pilotData.recommendation.badge;
  }
  if (recDescEl) recDescEl.innerText = pilotData.recommendation.description;

  const sub = pilotData.reliability.subscores || {};
  const updateF = (idS, idB, val, detail) => {
    const sEl = document.getElementById(idS);
    const bEl = document.getElementById(idB);
    if (sEl) {
      if (val != null) {
        sEl.innerHTML = `${val}/100 <span style="font-size:0.75rem;color:var(--text-muted);font-weight:600;margin-left:4px;">(${detail})</span>`;
      } else {
        sEl.innerText = '—';
      }
    }
    if (bEl) bEl.style.width = `${val || 0}%`;
  };

  const m = pilotData.metrics || {};
  const prodText = m.productivity != null ? `${m.productivity.toFixed(1)} paq/h` : 'Promedio';
  const attText = m.attendancePct != null ? `${m.attendancePct.toFixed(1)}% asist.` : `${sub.attendance || 0}% asist.`;
  const canText = m.cancellationPct != null ? `${m.cancellationPct.toFixed(1)}% canc.` : `${m.pilotCancelCount || 0} canc.`;
  const punctText = m.punctualityPct != null ? `${m.punctualityPct.toFixed(1)}% punt.` : '100% punt.';
  const slaText = m.avgSla35 != null ? `${m.avgSla35.toFixed(1)}% SLA` : 'Neutral (85%)';

  updateF('factorScoreProd', 'factorBarProd', sub.productivity, prodText);
  updateF('factorScoreAssist', 'factorBarAssist', sub.attendance, attText);
  updateF('factorScoreCancel', 'factorBarCancel', sub.cancellation, canText);
  updateF('factorScorePunct', 'factorBarPunct', sub.punctuality, punctText);
  updateF('factorScoreSla', 'factorBarSla', sub.sla, slaText);

  // Historial de turnos con correlación al periodo filtrado
  const historyBody = document.getElementById('profileShiftHistory');
  if (historyBody) {
    const filteredSet = new Set(AppState.filteredMalla || []);
    const sorted = pilotData.shifts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    historyBody.innerHTML = sorted.map(s => {
      const evalP = s.productivity_eval || evaluateProductivityMatch(s.packages, s.target_productivity);
      const isCurrentFilterPeriod = filteredSet.has(s);
      const contextBadge = s.low_demand
        ? '<span class="pill pill-warn">⚠ Baja demanda</span>'
        : (isCurrentFilterPeriod ? '<span class="pill pill-primary" title="Turno incluido en el filtro activo del encabezado">📅 Periodo activo</span>' : '<span class="pill pill-neutral">Histórico</span>');

      return `
        <tr ${isCurrentFilterPeriod ? 'style="background: rgba(139, 92, 246, 0.05);"' : ''}>
          <td>${s.date || '—'}</td>
          <td>${escapeHtml(s.store || '—')}</td>
          <td><span class="pill ${s.pilot_cancel ? 'pill-bad' : s.attended ? 'pill-good' : 'pill-neutral'}">${escapeHtml(s.status || '—')}</span></td>
          <td>${fmtMinutes(s.start)}</td>
          <td>${fmtMinutes(s.arrival)}</td>
          <td><strong>${fmtNum(s.packages, 0)}</strong></td>
          <td>${s.target_productivity ? s.target_productivity + ' paqs' : '—'}</td>
          <td><span class="pill ${evalP.badgeClass}">${evalP.label}</span></td>
          <td>${contextBadge}</td>
        </tr>
      `;
    }).join('');
    restoreTableSort(historyBody.closest('table'));
  }

  if (AppState.activeTab !== 'pilotos') {
    switchTab('pilotos');
  }
}

function handlePilotSearchTypeahead(query) {
  const dropdown = document.getElementById('profileSearchDropdown');
  if (!dropdown) return;
  const q = query.trim().toLowerCase();
  if (!q) { dropdown.style.display = 'none'; return; }

  const matches = AppState.pilotsList
    .filter(p => p.pilot.toLowerCase().includes(q) || p.pilot_id.toLowerCase().includes(q))
    .slice(0, 8);

  if (matches.length === 0) {
    dropdown.innerHTML = `<div style="padding:12px;color:var(--text-dim);">No se encontraron pilotos.</div>`;
    dropdown.style.display = 'block';
    return;
  }

  dropdown.innerHTML = matches.map(p => `
    <div style="padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);" onclick="selectPilotForProfile(decodeURIComponent('${encodeURIComponent(p.pilot || '')}')); document.getElementById('profileSearchDropdown').style.display='none';">
      <div style="font-weight:600;color:#fff;">${escapeHtml(p.pilot)}</div>
      <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(p.pilot_id)} · ${escapeHtml(p.city)} · Confiabilidad: ${p.reliability.score ?? '—'}/100</div>
    </div>
  `).join('');
  dropdown.style.display = 'block';
}

// Modal de Configuración
function setupConfigModal() {
  const modal = document.getElementById('modalConfig');
  document.getElementById('btnCloseConfig')?.addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('btnResetConfig')?.addEventListener('click', () => {
    APP_CONFIG = { ...DEFAULT_CONFIG, weights: { ...DEFAULT_CONFIG.weights } };
    populateConfigForm();
  });
  document.getElementById('btnSaveConfig')?.addEventListener('click', () => {
    const wProd = parseInt(document.getElementById('cfgWeightProd')?.value, 10) || 0;
    const wAssist = parseInt(document.getElementById('cfgWeightAssist')?.value, 10) || 0;
    const wCancel = parseInt(document.getElementById('cfgWeightCancel')?.value, 10) || 0;
    const wPunct = parseInt(document.getElementById('cfgWeightPunct')?.value, 10) || 0;
    const wSla = parseInt(document.getElementById('cfgWeightSla')?.value, 10) || 0;

    if ((wProd + wAssist + wCancel + wPunct + wSla) !== 100) {
      alert(`La suma de ponderaciones debe ser exactamente 100%. Actualmente es: ${wProd + wAssist + wCancel + wPunct + wSla}%`);
      return;
    }

    APP_CONFIG.weights = { productivity: wProd, attendance: wAssist, cancellation: wCancel, punctuality: wPunct, sla35: wSla };
    APP_CONFIG.attendanceGreen = parseFloat(document.getElementById('cfgAttGreen')?.value) || 95;
    APP_CONFIG.attendanceYellow = parseFloat(document.getElementById('cfgAttYellow')?.value) || 90;
    APP_CONFIG.cancellationGreen = parseFloat(document.getElementById('cfgCanGreen')?.value) || 5;
    APP_CONFIG.cancellationYellow = parseFloat(document.getElementById('cfgCanYellow')?.value) || 10;
    APP_CONFIG.riskCancelThreshold = parseFloat(document.getElementById('cfgRiskThreshold')?.value) || 10;

    // Umbrales calibrables de Productividad por Turno (Match Compuesto)
    APP_CONFIG.prodThresholdProductive = parseFloat(document.getElementById('cfgProdProductive')?.value) || 95.0;
    APP_CONFIG.prodThresholdAcceptable = parseFloat(document.getElementById('cfgProdAcceptable')?.value) || 90.0;
    APP_CONFIG.prodThresholdLow = parseFloat(document.getElementById('cfgProdLow')?.value) || 75.0;

    saveConfig(APP_CONFIG);
    modal.classList.remove('active');
    applyFilters();
  });
}

function openConfigModal() {
  populateConfigForm();
  document.getElementById('modalConfig')?.classList.add('active');
}

function populateConfigForm() {
  const w = APP_CONFIG.weights || DEFAULT_CONFIG.weights;
  if (document.getElementById('cfgWeightProd')) document.getElementById('cfgWeightProd').value = w.productivity;
  if (document.getElementById('cfgWeightAssist')) document.getElementById('cfgWeightAssist').value = w.attendance;
  if (document.getElementById('cfgWeightCancel')) document.getElementById('cfgWeightCancel').value = w.cancellation;
  if (document.getElementById('cfgWeightPunct')) document.getElementById('cfgWeightPunct').value = w.punctuality;
  if (document.getElementById('cfgWeightSla')) document.getElementById('cfgWeightSla').value = w.sla35;
  if (document.getElementById('cfgAttGreen')) document.getElementById('cfgAttGreen').value = APP_CONFIG.attendanceGreen;
  if (document.getElementById('cfgAttYellow')) document.getElementById('cfgAttYellow').value = APP_CONFIG.attendanceYellow;
  if (document.getElementById('cfgCanGreen')) document.getElementById('cfgCanGreen').value = APP_CONFIG.cancellationGreen;
  if (document.getElementById('cfgCanYellow')) document.getElementById('cfgCanYellow').value = APP_CONFIG.cancellationYellow;
  if (document.getElementById('cfgRiskThreshold')) document.getElementById('cfgRiskThreshold').value = APP_CONFIG.riskCancelThreshold || 10;

  // Cargar umbrales de productividad
  if (document.getElementById('cfgProdProductive')) document.getElementById('cfgProdProductive').value = APP_CONFIG.prodThresholdProductive ?? 95.0;
  if (document.getElementById('cfgProdAcceptable')) document.getElementById('cfgProdAcceptable').value = APP_CONFIG.prodThresholdAcceptable ?? 90.0;
  if (document.getElementById('cfgProdLow')) document.getElementById('cfgProdLow').value = APP_CONFIG.prodThresholdLow ?? 75.0;
}

// Exportación CSV General (header)
function exportToCsv() {
  exportProductividadCsv();
}

// ============================================================
// MOTOR DE EXPORTACIÓN DINÁMICA INTELIGENTE v16
// Contextual · UTF-8 BOM · Nomenclatura dinámica · Sin HTML
// ============================================================

function buildDynamicFilename(prefix, extension = 'csv') {
  const city    = document.getElementById('filterCity')?.value;
  const store   = document.getElementById('filterStore')?.value;
  const semana  = document.getElementById('filterSemana');
  const semanaIdx = semana?.selectedIndex;
  const semanaOpt = semana?.options[semanaIdx];
  let weekPart = '';
  if (semanaOpt?.value) {
    const match = semanaOpt.text.match(/Sem\s*(\d+)/i);
    if (match) weekPart = `_Sem${match[1]}`;
  }
  const storePart = store ? `_${store.replace(/[^a-zA-Z0-9À-ɏ]/g, '').substring(0, 20)}` : '';
  const cityPart  = city  ? `_${city.replace(/\s+/g, '')}` : '';
  const datePart  = new Date().toISOString().slice(0, 10);
  return `${prefix}${weekPart}${cityPart}${storePart}_${datePart}.${extension}`;
}

function stripHtml(str) {
  return String(str ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'").trim();
}

function buildCsvBlob(headerRow, dataRows) {
  const lines = [headerRow.join(','), ...dataRows];
  return new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Exportar Módulo 1: Productividad (solo registros visibles / filtrados)
function exportProductividadCsv() {
  // Determinar qué filas están visibles (puede haber filtro in-table)
  const tbody = document.getElementById('tableMallaProductividad');
  let rows = AppState.filteredMalla;

  // Aplicar exclusiones por defecto igual que renderMallaProductivityTable
  const defaultExclusions = new Set(['piloto cancela','cancela piloto','piloto canceló','adicional cancela','adicional cancelado','tienda cerrada','cliente cancela','no programado']);
  if (AppState.selectedStatuses?.length > 0) {
    const targetSet = new Set(AppState.selectedStatuses.map(s => normalizeKeyStr(s)));
    rows = rows.filter(r => targetSet.has(normalizeKeyStr(r.status)));
  } else {
    rows = rows.filter(r => { const st = (r.status || '').trim(); return st && !defaultExclusions.has(st.toLowerCase()); });
  }

  // Aplicar búsqueda in-table si hay texto activo
  const q = document.getElementById('mallaTableSearch')?.value?.trim().toLowerCase();
  if (q) rows = rows.filter(r => [r.date,r.weekday,r.pilot,r.pilot_id,r.store,r.status,r.city].join(' ').toLowerCase().includes(q));

  const sorted = rows.slice().sort((a,b) => (b.date||'').localeCompare(a.date||''));

  const headers = ['Fecha','Día','Piloto','ID','Telefono','Ciudad','Punto / Tienda','Inicio','Estado','Paquetes Reales','Meta Paquetes','Evaluacion','% Productividad vs Meta'];
  const dataRows = sorted.map(r => {
    const evalP = r.productivity_eval || evaluateProductivityMatch(r.packages, r.target_productivity, APP_CONFIG);
    return [
      `"${r.date || ''}"`,
      `"${stripHtml(r.weekday || '')}"`,
      `"${(r.pilot || '').replace(/"/g,'""')}"`,
      `"${r.pilot_id || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.city || ''}"`,
      `"${(r.store || '').replace(/"/g,'""')}"`,
      fmtMinutes(r.start),
      `"${stripHtml(r.status || '')}"`,
      r.packages ?? 0,
      r.target_productivity ?? '',
      `"${stripHtml(evalP.label)}"`,
      evalP.ratioPct != null ? evalP.ratioPct + '%' : ''
    ].join(',');
  });

  const filename = buildDynamicFilename('Reporte_Productividad');
  downloadBlob(buildCsvBlob(headers, dataRows), filename);
}

// Exportar Módulo 2: Cobertura (registros visibles por tienda)
function exportCoberturaCsv() {
  const coverage = AppState.coverageAnalysis;
  if (!coverage || !coverage.stores) return;

  // Filtrar si hay búsqueda in-table activa
  const q = document.getElementById('coberturaTableSearch')?.value?.trim().toLowerCase();
  let stores = coverage.stores;
  if (q) stores = stores.filter(st => `${st.store} ${st.city}`.toLowerCase().includes(q));

  const headers = ['Tienda / Punto','Ciudad','Cupos Requeridos','Asignados','Cupos Faltantes','% Cobertura','Estado'];
  const dataRows = stores.map(st => {
    const calculatedMissing = Math.max(0, (st.total || 0) - (st.assigned || 0));
    const vacantCount = Math.max(st.vacant || 0, calculatedMissing);
    return [
      `"${(st.store || '').replace(/"/g,'""')}"`,
      `"${st.city || ''}"`,
      st.total,
      st.assigned,
      vacantCount,
      `${st.coveragePct}%`,
      `"${vacantCount > 0 ? 'Requiere Cobertura' : 'Cubierto'}"`
    ].join(',');
  });

  const filename = buildDynamicFilename('Reporte_Cobertura');
  downloadBlob(buildCsvBlob(headers, dataRows), filename);
}

// Exportar Componente 1: Auditoría de la Tienda Seleccionada (Top 5)
function exportAuditoriaTiendaCsv() {
  const currentStore = AppState.selectedRankingStore || document.getElementById('rankingStoreSelect')?.value || '';
  if (!currentStore) return;

  const top5 = RankingFlotaCriticaEngine.getTop5ByStore(AppState.filteredMalla, currentStore);

  // Filtro in-table si hay texto
  const q = document.getElementById('flotaTableSearch')?.value?.trim().toLowerCase();
  let rows = top5;
  if (q) rows = rows.filter(p => `${p.pilot} ${p.pilot_id}`.toLowerCase().includes(q));

  const headers = ['Posicion','Piloto','ID','Telefono','Tienda','N° Cancelaciones','Turnos Realizados','% Productividad vs Meta','Prod Real (paq/h)','Score Riesgo','Status Operativo'];
  const dataRows = rows.map((p, idx) => [
    idx + 1,
    `"${(p.pilot || '').replace(/"/g,'""')}"`,
    `"${p.pilot_id || ''}"`,
    `"${p.phone || ''}"`,
    `"${currentStore.replace(/"/g,'""')}"`,
    p.cancels,
    p.attendedCount,
    `${p.prodPct}%`,
    p.prodPaqH,
    p.riskScore,
    `"${stripHtml(p.statusTag?.label || '')}"` 
  ].join(','));

  const storeSafe = currentStore.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '').substring(0, 20);
  const datePart  = new Date().toISOString().slice(0, 10);
  const filename  = `Auditoria_Tienda_${storeSafe}_${datePart}.csv`;
  downloadBlob(buildCsvBlob(headers, dataRows), filename);
}

// Exportar Componente 2: Escalafón Global de la Flota (Ranking Total en CSV)
function exportEscalafonGlobalCsv() {
  const shifts = AppState.filteredMalla;
  if (!shifts || typeof RankingFlotaCriticaEngine === 'undefined') return;

  const fleetRanking = RankingFlotaCriticaEngine.getGlobalTop10Cancels(shifts);
  if (!fleetRanking || fleetRanking.length === 0) {
    alert('No se encontraron pilotos con al menos 1 turno programado en el periodo filtrado.');
    return;
  }

  // Filtrar si hay búsqueda in-table activa en el escalafón
  const q = document.getElementById('escalafonTableSearch')?.value?.trim().toLowerCase();
  let rows = fleetRanking;
  if (q) rows = rows.filter(p => `${p.pilot} ${p.pilot_id} ${p.city} ${p.storesLabel}`.toLowerCase().includes(q));

  const headers = [
    'Ranking',
    'Piloto',
    'ID Piloto',
    'Telefono',
    'Ciudad',
    'Tiendas donde Opera',
    'Total Cancelaciones',
    'Turnos Programados',
    '% Cancelacion',
    'Prod Real (paq/h)',
    '% Productividad vs Meta',
    'Score Riesgo',
    'Accion Sugerida'
  ];

  const dataRows = rows.map((p, idx) => [
    idx + 1,
    `"${(p.pilot || '').replace(/"/g, '""')}"`,
    `"${p.pilot_id || ''}"`,
    `"${p.phone || ''}"`,
    `"${p.city || ''}"`,
    `"${(p.storesLabel || '').replace(/"/g, '""')}"`,
    p.cancels,
    p.totalShifts,
    `${p.cancelImpactPct}%`,
    p.prodPaqH,
    `${p.prodPct}%`,
    p.riskScore,
    `"${stripHtml(p.suggestedAction?.label || '')}"`
  ].join(','));

  const filename = buildDynamicFilename('Escalafon_Global_Flota');
  downloadBlob(buildCsvBlob(headers, dataRows), filename);
}

document.addEventListener('DOMContentLoaded', initApp);
