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
  selectedRankingStore: null
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

/**
 * Normaliza fechas ingresadas manualmente (DD/MM/AAAA, AAAA-MM-DD, D/M/AAAA)
 * a formato ISO YYYY-MM-DD para filtrado exacto.
 */
function parseHybridDate(val) {
  if (!val) return '';
  const s = String(val).trim().split(' ')[0].split('T')[0];
  // Formato DD/MM/AAAA o DD-MM-AAAA
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  // Formato AAAA-MM-DD o AAAA/MM/DD
  const ymdMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return s.length >= 10 ? s.substring(0, 10) : '';
}

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

// Inicialización
async function initApp() {
  setupEventListeners();

  // 1. Inicializar base de datos IndexedDB
  try {
    await TaDaDB.open();
    console.log('IndexedDB inicializado correctamente.');

    // Cargar datos locales de IndexedDB si existen
    const cachedMalla = await TaDaDB.getMallaShifts();
    const cachedProg = await TaDaDB.getProgramacionShifts();
    const meta = await TaDaDB.getMeta('last_sync');

    // Detectar caché obsoleto, incompleto o con esquema previo a la incorporación de todas las semanas
    const CACHE_VERSION = '2026-09-29-all-weeks-v15';
    const cachedVersion = await TaDaDB.getMeta('cache_version');
    const versionMismatch = cachedVersion !== CACHE_VERSION;
    const cachedCities = new Set(cachedMalla.map(r => r.city).filter(Boolean));
    const cacheIsStale = cachedMalla.length > 0 && (cachedCities.size < 4 || cachedMalla.length < 3000 || versionMismatch);

    if (cachedMalla.length > 0 && cachedProg.length > 0 && !cacheIsStale) {
      AppState.mallaShifts = cachedMalla;
      AppState.progShifts = cachedProg;
      const effectiveRef = SheetsService.getEffectiveRefDate(cachedMalla);
      AppState.temporal = sanitizeTemporalWindow(SheetsService.getRollingTemporalWindow(effectiveRef));
      updateTemporalBanner();
      updateSyncStatus(`En caché local · Última sincronización: ${new Date(meta?.timestamp || Date.now()).toLocaleTimeString()} (${cachedMalla.length} turnos, ${cachedCities.size} ciudades)`);
      populateFilterOptions();
      applyFilters();
    } else {
      if (cacheIsStale) {
        console.warn(`[initApp] Actualizando esquema/caché con Cali completa y corte a 12 PM (versión ${CACHE_VERSION}). Sincronizando.`);
        await TaDaDB.clearAll?.();
        await TaDaDB.setMeta('cache_version', CACHE_VERSION);
      }
      await triggerLiveSync();
      await TaDaDB.setMeta('cache_version', CACHE_VERSION);
    }
  } catch (err) {
    console.warn('Error accediendo a IndexedDB, usando datos base:', err);
    AppState.mallaShifts = typeof BASE_DATA !== 'undefined' ? BASE_DATA : [];
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
      cuposEl.innerHTML = `
        <span class="pill badge-cupo-faltante" title="Cupos sin conductor asignado esta semana">
          🚨 ${currentWeekVacant} Cupo${currentWeekVacant > 1 ? 's' : ''} Faltante${currentWeekVacant > 1 ? 's' : ''} &mdash; Sem. Actual
        </span>
      `;
    } else if (AppState.progShifts.length > 0) {
      cuposEl.innerHTML = `<span class="pill pill-good">✅ Cobertura 100% en semana actual</span>`;
    } else {
      cuposEl.innerHTML = `<span style="color:var(--text-muted);font-size:0.76rem;">Sin datos de programación cargados</span>`;
    }
  }
}

// Configurar escuchadores de eventos y selectores híbridos/múltiples
function setupEventListeners() {
  // Tabs
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

  // Listeners del Módulo de Flota Crítica
  document.getElementById('rankingStoreSelect')?.addEventListener('change', (e) => {
    AppState.selectedRankingStore = e.target.value;
    renderTop5StoreTable();
  });
  document.getElementById('btnExportCriticalRanking')?.addEventListener('click', exportCriticalRankingCsv);

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
  AppState.selectedDays = [];
  AppState.selectedStartTimes = [];
  AppState.selectedStatuses = [];
  multiSelectDia?.clear();
  multiSelectInicio?.clear();
  multiSelectEstado?.clear();
  applyFilters();
}

function generatePilotsList() {
  const pilotMap = {};
  AppState.filteredMalla.forEach(r => {
    if (!r.pilot) return;
    if (!pilotMap[r.pilot]) pilotMap[r.pilot] = [];
    pilotMap[r.pilot].push(r);
  });

  AppState.pilotsList = Object.entries(pilotMap).map(([pilot, shifts]) => {
    const metrics = aggregateShiftMetrics(shifts, APP_CONFIG);
    const reliability = calculateReliabilityScore(metrics, APP_CONFIG);
    const first = shifts[0] || {};
    return {
      pilot,
      pilot_id: first.pilot_id || '—',
      phone: first.phone || '—',
      city: first.city || '—',
      mainStore: first.store || '—',
      shifts,
      metrics,
      reliability,
      recommendation: reliability
    };
  }).sort((a, b) => (b.reliability.score ?? -1) - (a.reliability.score ?? -1));
}

// ============================================================
// REESTRUCTURACIÓN DE TARJETAS KPI (EXCLUSIVAS DEL MÓDULO 1)
// 9 Tarjetas Oficiales Recalibradas con Regla de Match Transversal
// ============================================================
function renderKpis() {
  const container = document.getElementById('kpisContainer');
  if (!container) return;

  const kpis = calculateModulo1Kpis(AppState.filteredMalla, APP_CONFIG);

  const effColor = kpis.asistenciaEffectivenessPct == null ? ''
    : kpis.asistenciaEffectivenessPct >= (APP_CONFIG.attendanceGreen || 95) ? 'kpi-emerald'
    : kpis.asistenciaEffectivenessPct >= (APP_CONFIG.attendanceYellow || 90) ? 'kpi-amber' : 'kpi-rose';

  const canColor = kpis.cancellationRatePct == null ? ''
    : kpis.cancellationRatePct <= (APP_CONFIG.cancellationGreen || 5) ? 'kpi-emerald'
    : kpis.cancellationRatePct <= (APP_CONFIG.cancellationYellow || 10) ? 'kpi-amber' : 'kpi-rose';

  const covColor = kpis.cuposCoveragePct == null ? ''
    : kpis.cuposCoveragePct >= 95 ? 'kpi-emerald'
    : kpis.cuposCoveragePct >= 85 ? 'kpi-amber' : 'kpi-rose';

  const vacColor = kpis.cuposFaltantesTotal > 0 ? 'kpi-rose' : 'kpi-emerald';

  const puncColor = kpis.punctualityPct == null ? ''
    : kpis.punctualityPct >= (APP_CONFIG.punctualityGreen || 90) ? 'kpi-emerald'
    : kpis.punctualityPct >= (APP_CONFIG.punctualityYellow || 80) ? 'kpi-amber' : 'kpi-rose';

  const attScaleColor = kpis.avgAttendanceScale7 >= 6.5 ? 'kpi-emerald'
    : kpis.avgAttendanceScale7 >= 5.5 ? 'kpi-amber' : 'kpi-rose';

  const cards = [
    {
      label: '1. Efectividad de Asistencia',
      value: fmtPct(kpis.asistenciaEffectivenessPct),
      sub: `${kpis.asistenciaCoveredCount} cubiertos de ${kpis.asistenciaRequiredCount} requeridos (Match transversal)`,
      icon: '🛡️',
      colorClass: effColor
    },
    {
      label: '2. Tasa de Cancelación',
      value: fmtPct(kpis.cancellationRatePct),
      sub: `${kpis.cuposFaltantesBreakdown.rawCancels ?? kpis.penalizedBreakdown.pilotCancel} cancelados (${kpis.cuposFaltantesBreakdown.matchedReplacements || 0} cubiertos con reemplazo · ${kpis.cuposFaltantesBreakdown.unmatchedCancels || 0} sin reemplazo)`,
      icon: '🚫',
      colorClass: canColor
    },
    {
      label: '3. Cobertura de Cupos',
      value: fmtPct(kpis.cuposCoveragePct),
      sub: `(${kpis.cuposEvaluatedCount} requeridos + ${kpis.cuposCoveredCount - kpis.cuposEvaluatedCount} reemplazos) / ${kpis.cuposEvaluatedCount} requeridos`,
      icon: '🎯',
      colorClass: covColor
    },
    {
      label: '4. Cupos Faltantes (Vacantes)',
      value: fmtNum(kpis.cuposFaltantesTotal, 0),
      sub: `${kpis.cuposFaltantesBreakdown.unmatchedCancels} cancelados sin reemplazo · ${kpis.cuposFaltantesBreakdown.noProgramado} no prog · ${kpis.cuposFaltantesBreakdown.sinPiloto} sin piloto`,
      icon: '⚠️',
      colorClass: vacColor
    },
    {
      label: '5. Puntualidad de Llegada',
      value: fmtPct(kpis.punctualityPct),
      sub: `Gabela 09:00 hasta 10:15 / +30min · ${kpis.punctualCount} de ${kpis.punctualityEvaluatedCount} evaluados`,
      icon: '⏱️',
      colorClass: puncColor
    },
    {
      label: '6. Pilotos Activos',
      value: fmtNum(kpis.activePilotsCount, 0),
      sub: 'Pilotos únicos (por ID) programados en el rango filtrado',
      icon: '🛵',
      colorClass: 'kpi-blue'
    },
    {
      label: '7. Paquetes Entregados',
      value: fmtNum(kpis.totalPackages, 0),
      sub: `Horas gestionadas: ${fmtNum(AppState.filteredMalla.length, 0)} turnos × 8h = ${fmtNum(kpis.totalManagedHours, 0)}h`,
      icon: '📦',
      colorClass: 'kpi-purple'
    },
    {
      label: '8. Productividad Flota',
      value: `${kpis.fleetProductivityPaqH.toFixed(2)} paq/h`,
      sub: `${fmtNum(kpis.totalPackages, 0)} paquetes / ${fmtNum(kpis.totalManagedHours, 0)} Horas gestionadas`,
      icon: '⚡',
      colorClass: 'kpi-emerald'
    },
    {
      label: '9. Promedio de Asistencia',
      value: `${kpis.avgAttendanceScale7.toFixed(2)} / 7 días`,
      sub: `Tasa proyectada semanal por cada 7 turnos (${kpis.avgAttendancePct.toFixed(1)}% flota)`,
      icon: '📊',
      colorClass: attScaleColor
    }
  ];

  container.innerHTML = cards.map(c => `
    <div class="kpi-card ${c.colorClass}">
      <div class="kpi-header">
        <span class="kpi-label">${c.label}</span>
        <span class="kpi-icon">${c.icon}</span>
      </div>
      <div class="kpi-value">${c.value}</div>
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
  if (countEl) countEl.innerText = `${fmtNum(total, 0)} turnos renderizados (100% de registros filtrados)`;
  if (badgeEl) badgeEl.innerText = `100% visible · ${fmtNum(total, 0)} filas`;

  if (total === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-dim);">No hay registros para este filtro o todos fueron excluidos por defecto.</td></tr>`;
    return;
  }

  // Ordenar por fecha descendente
  const sorted = rowsToDisplay.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Nuevo orden de columnas: Fecha | Día | Piloto / ID | Punto / Seller | Inicio | Estado | Paquetes Reales | Promedio de Paquetes (Meta) | Evaluación | Ficha
  tbody.innerHTML = sorted.map(r => {
    const targetVal = r.target_productivity ? `${r.target_productivity} paqs` : '—';
    const realVal = r.packages != null ? `${r.packages} paqs` : '0 paqs';
    const evalP = evaluateProductivityMatch(r.packages, r.target_productivity, APP_CONFIG);

    return `
      <tr>
        <td>${r.date || '—'}</td>
        <td>${escapeHtml(r.weekday || '—')}</td>
        <td>
          <div class="pilot-name-cell">
            <a href="javascript:void(0)" onclick="selectPilotForProfile('${escapeHtml(r.pilot)}')" style="color:#fff;text-decoration:none;">${escapeHtml(r.pilot || '—')}</a>
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
          <button class="btn btn-secondary btn-icon-only" onclick="selectPilotForProfile('${escapeHtml(r.pilot)}')" title="Ver Ficha 360°">👤</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================
// MÓDULO 2: PLANIFICACIÓN Y COBERTURA PREVENTIVA
// ============================================================
function renderModulo2Coverage() {
  const tableCoverage = document.getElementById('tableCoverageStores');
  const tableRisk = document.getElementById('tableScheduledShiftsRisk');
  if (!tableCoverage || !tableRisk) return;

  // 0. Panel de Semana Actual (Obs. 3)
  if (AppState.temporal) {
    const curr = AppState.temporal.currentWeek;
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const ws = parseDateToNoon(curr.startDate);
    const we = parseDateToNoon(curr.endDate);
    const weekRangeLabel = `${ws.getDate()} ${monthNames[ws.getMonth()]} – ${we.getDate()} ${monthNames[we.getMonth()]} ${we.getFullYear()}`;

    const weekProgShifts = AppState.progShifts.filter(s => isDateInRangeWithNoonCut(s.date, curr.startDate, curr.endDate));
    const weekMatch = typeof reconcileShiftsMatch === 'function' ? reconcileShiftsMatch(weekProgShifts) : null;
    const weekTotal = weekMatch ? weekMatch.totalSlotsRequired : weekProgShifts.length;
    const weekAssigned = weekMatch ? weekMatch.totalSlotsCovered : weekProgShifts.filter(s => !s.is_vacant).length;
    const weekVacant = weekMatch ? weekMatch.totalSlotsMissing : weekProgShifts.filter(s => s.is_vacant).length;
    const weekCovPct = weekMatch ? Math.round(weekMatch.cuposCoveragePct) : (weekTotal > 0 ? Math.round((weekAssigned / weekTotal) * 100) : 100);

    const labelEl = document.getElementById('currentWeekCoverageLabel');
    if (labelEl) labelEl.innerText = `Sem ${curr.weekNumber} · ${weekRangeLabel} · ${weekTotal} turnos requeridos`;

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
        mini('Cupos Totales', weekTotal, 'turnos requeridos esta semana', '#8b5cf6'),
        mini('Cubiertos ✅', weekAssigned, `${weekMatch?.totalMatchedReplacements || 0} reemplazos matched`, '#10b981'),
        mini(weekVacant > 0 ? '🚨 Cupos Faltantes' : 'Cupos Faltantes', weekVacant,
          weekVacant > 0 ? `${weekMatch?.totalUnmatchedCancels || 0} cancelados sin reemplazo` : 'Flota completa ✔',
          weekVacant > 0 ? '#ef4444' : '#10b981'),
        mini('Cobertura %', `${weekCovPct}%`, `${weekCovPct >= 100 ? 'Flota completa' : 'Faltante por cubrir'}`, weekCovPct >= 100 ? '#10b981' : weekCovPct >= 80 ? '#f59e0b' : '#ef4444')
      ].join('');
    }
  }

  // 1. Análisis de Cobertura por Tienda
  const coverage = CoverageEngine.analyzeCoverage(AppState.filteredProg);
  AppState.coverageAnalysis = coverage;

  tableCoverage.innerHTML = coverage.stores.map(st => {
    const isFull = st.vacant === 0;
    return `
      <tr>
        <td><strong>${escapeHtml(st.store)}</strong></td>
        <td><span class="pill pill-neutral">${escapeHtml(st.city)}</span></td>
        <td>${st.total}</td>
        <td><span class="pill pill-good">${st.assigned}</span></td>
        <td><span class="pill ${st.vacant > 0 ? 'badge-cupo-faltante' : 'pill-neutral'}">${st.vacant}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
              <div style="width:${st.coveragePct}%;height:100%;background:${isFull ? '#10b981' : '#f59e0b'};"></div>
            </div>
            <strong style="font-size:0.75rem;">${st.coveragePct}%</strong>
          </div>
        </td>
        <td>
          ${st.vacant > 0 ? `<button class="btn btn-primary btn-icon-only" onclick="openSuplentesModalForStore('${escapeHtml(st.store)}')">Sugerir Suplentes</button>` : '<span class="pill pill-good">Cubierto</span>'}
        </td>
      </tr>
    `;
  }).join('');

  // 2. Scoring de Riesgo y Alertas de Reemplazo
  const evaluatedShifts = CoverageEngine.evaluateScheduledShiftsRisk(
    AppState.filteredProg,
    AppState.mallaShifts,
    APP_CONFIG
  );

  // Mostrar turnos priorizando cupos faltantes y alto riesgo
  evaluatedShifts.sort((a, b) => {
    const order = { vacant: 1, high: 2, medium: 3, low: 4, unknown: 5 };
    return (order[a.risk.level] || 9) - (order[b.risk.level] || 9);
  });

  tableRisk.innerHTML = evaluatedShifts.slice(0, 60).map((s, idx) => {
    const isVacant = s.is_vacant;
    return `
      <tr>
        <td>${s.date || '—'}</td>
        <td>${escapeHtml(s.store || '—')}</td>
        <td>${escapeHtml(s.weekday || '—')}</td>
        <td>${fmtMinutes(s.start)} - ${fmtMinutes(s.end_time)}</td>
        <td>
          ${isVacant ? '<span style="color:#ff6b6b;font-weight:700;">[SIN ASIGNAR]</span>' : `
            <div class="pilot-name-cell">
              <span>${escapeHtml(s.pilot)}</span>
              <span class="pilot-meta">${escapeHtml(s.phone || '')}</span>
            </div>
          `}
        </td>
        <td><span class="pill ${s.risk.badgeClass}">${s.risk.label}</span></td>
        <td style="font-size:0.75rem;color:var(--text-muted);max-width:260px;">${s.risk.description}</td>
        <td>
          <button class="btn ${isVacant || s.risk.level === 'high' ? 'btn-primary' : 'btn-secondary'} btn-icon-only" onclick="openSuplentesModalForShift(${idx})">
            🔍 Sugerir Suplente
          </button>
        </td>
      </tr>
    `;
  }).join('');
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

  // Inicializar los 3 gráficos principales de esa semana
  ChartManager.initCurrentWeekCharts(
    targetMalla,
    targetProg
  );

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

    // APLICAR REGLAS OFICIALES DE LAS TARJETAS KPI (MatchEngine + Cancelaciones vs Reemplazos + Exclusiones)
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
    if (s.pilot_cancel || rawSt === 'piloto cancela' || rawSt === 'cancela') {
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

          <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'}" onclick="auditStoreInTop5('${escapeHtml(st.store)}')" style="padding: 6px 12px; font-size: 0.75rem;">
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
          ✅ No se detectaron pilotos críticos con ≥2 turnos programados en <strong>${escapeHtml(currentStore)}</strong> dentro del periodo seleccionado.
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
          <button class="btn btn-secondary" onclick="viewPilotProfileDirect('${escapeHtml(p.pilot)}')" style="padding:4px 8px;font-size:0.75rem;">
            👤 Ficha 360°
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTop10GlobalTable() {
  const tableBody = document.getElementById('tableTop10Global');
  if (!tableBody) return;

  const top10 = RankingFlotaCriticaEngine.getGlobalTop10Cancels(AppState.filteredMalla);

  if (top10.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center;padding:24px;color:var(--text-dim);">
          ✅ Excelente: No se registraron pilotos con cancelaciones en el periodo filtrado (con mínimo 2 turnos programados).
        </td>
      </tr>
    `;
    return;
  }

  const medals = ['🥇 #1', '🥈 #2', '🥉 #3'];

  tableBody.innerHTML = top10.map((p, idx) => {
    const posLabel = idx < 3 ? medals[idx] : `#${idx + 1}`;
    const rankClass = idx === 0 ? 'pill-bad' : (idx < 3 ? 'pill-warn' : 'pill-neutral');

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
          <span class="pill pill-bad" style="font-weight:800;font-size:0.85rem;">
            ${p.cancels} cancela${p.cancels > 1 ? 'ciones' : 'ción'}
          </span>
        </td>
        <td style="text-align:center;"><strong>${p.totalShifts}</strong> turnos</td>
        <td style="text-align:center;">
          <span class="pill ${p.cancelImpactPct >= 40 ? 'badge-bajo' : 'badge-aceptable'}">
            ${p.cancelImpactPct}%
          </span>
        </td>
        <td style="text-align:center;">
          <strong>${p.prodPaqH}</strong> paq/h
          <div style="font-size:0.72rem;color:var(--text-muted);">${p.prodPct}% meta</div>
        </td>
        <td style="text-align:center;">
          <span style="font-weight:700;color:${p.riskScore >= 70 ? 'var(--color-danger, #ef4444)' : 'var(--color-warning, #f59e0b)'};">
            ${p.riskScore}
          </span>
        </td>
        <td style="text-align:center;">
          <span class="pill ${p.suggestedAction.colorClass}" style="font-weight:600;">
            ${escapeHtml(p.suggestedAction.label)}
          </span>
        </td>
        <td style="text-align:center;">
          <button class="btn btn-secondary" onclick="viewPilotProfileDirect('${escapeHtml(p.pilot)}')" style="padding:4px 8px;font-size:0.75rem;">
            🔍 360°
          </button>
        </td>
      </tr>
    `;
  }).join('');
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
  csv += `Periodo: ${from} al ${to} | Ciudad: ${city} | Filtro minimo: 2 turnos programados\r\n`;
  csv += `Generado el: ${new Date().toLocaleString('es-CO')}\r\n\r\n`;

  // SECCION 1: TOP 3 TIENDAS CON MAYOR CANCELACION
  const top3Stores = RankingFlotaCriticaEngine.getTop3StoresByCancels(shifts);
  csv += '--- TOP 3 TIENDAS CON MAYOR CONCENTRACION DE CANCELACIONES ---\r\n';
  csv += 'Posicion,Tienda,Ciudad,Total Cancelaciones,Cancelaciones sin Reemplazo (Faltantes),Cancelaciones Cubiertas con Reemplazo,Total Turnos,Tasa Cancelacion (%)\r\n';
  top3Stores.forEach((st, idx) => {
    csv += `${idx + 1},"${st.store.replace(/"/g, '""')}","${st.city.replace(/"/g, '""')}",${st.cancels},${st.unmatchedCancels},${st.matchedCancels},${st.totalShifts},${st.cancelRatePct}%\r\n`;
  });
  csv += '\r\n';

  // SECCION 2: ESCALAFON GLOBAL TOP 10
  csv += '--- ESCALAFON GLOBAL TOP 10 CON MAS CANCELACIONES ---\r\n';
  csv += 'Ranking,Piloto,ID,Telefono,Ciudad,Tiendas donde Opera,Total Cancelaciones,Turnos Programados,% Impacto Cancelacion,Prod Real (paq/h),% Productividad vs Meta,Score Riesgo,Accion Sugerida\r\n';

  if (globalTop10.length === 0) {
    csv += 'No se registraron pilotos con cancelaciones (minimo 2 turnos programados) en el periodo filtrado.\r\n';
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
    csv += `No se encontraron pilotos con suficiente historial (minimo 2 turnos) en la tienda ${currentStore}.\r\n`;
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

  // Aplicar motor con los 3 criterios
  const candidates = CoverageEngine.suggestReplacements(
    targetShift,
    AppState.mallaShifts,
    AppState.progShifts
  );

  if (!listEl) return;

  if (candidates.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-dim);">No se encontraron suplentes disponibles sin turno en esa fecha.</div>`;
  } else {
    listEl.innerHTML = candidates.map(c => {
      const cleanPhone = (c.phone || '').replace(/\D/g, '');
      const waLink = cleanPhone ? `https://wa.me/57${cleanPhone}?text=Hola%20${encodeURIComponent(c.name)},%20te%20escribimos%20de%20operaciones%20TaDa/Pibox%20para%20confirmar%20tu%20disponibilidad%20el%20turno%20en%20${encodeURIComponent(targetShift.store)}` : null;

      return `
        <div class="suplente-card">
          <div>
            <div style="font-weight:700;color:#fff;font-size:0.95rem;">${escapeHtml(c.name)}</div>
            <div class="suplente-meta">
              <span>🏪 ${c.storeInfo}</span>
              <span>📅 ${c.dayInfo}</span>
              <span>🛡️ Asistencia: <strong>${c.globalAssistPct}%</strong></span>
            </div>
          </div>
          <div style="text-align:right;display:flex;align-items:center;gap:12px;">
            <div>
              <div style="font-size:1.2rem;font-weight:800;color:#10b981;">${c.fitScore} pts</div>
              <div style="font-size:0.7rem;color:var(--text-dim);">Afinidad 3 Criterios</div>
            </div>
            ${waLink ? `<a href="${waLink}" target="_blank" class="btn btn-whatsapp">💬 WhatsApp</a>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  if (modal) modal.classList.add('active');
}

// ============================================================
// FICHA 360° DEL PILOTO
// ============================================================
function selectPilotForProfile(pilotName) {
  const pilotData = AppState.pilotsList.find(p => p.pilot === pilotName);
  if (!pilotData) return;

  AppState.selectedPilot = pilotData;

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
  const updateF = (idS, idB, val) => {
    const sEl = document.getElementById(idS);
    const bEl = document.getElementById(idB);
    if (sEl) sEl.innerText = val != null ? `${val}/100` : '—';
    if (bEl) bEl.style.width = `${val || 0}%`;
  };

  updateF('factorScoreProd', 'factorBarProd', sub.productivity);
  updateF('factorScoreAssist', 'factorBarAssist', sub.attendance);
  updateF('factorScoreCancel', 'factorBarCancel', sub.cancellation);
  updateF('factorScorePunct', 'factorBarPunct', sub.punctuality);
  updateF('factorScoreSla', 'factorBarSla', sub.sla);

  // Historial de turnos
  const historyBody = document.getElementById('profileShiftHistory');
  if (historyBody) {
    const sorted = pilotData.shifts.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    historyBody.innerHTML = sorted.map(s => {
      const evalP = s.productivity_eval || evaluateProductivityMatch(s.packages, s.target_productivity);
      return `
        <tr>
          <td>${s.date || '—'}</td>
          <td>${escapeHtml(s.store || '—')}</td>
          <td><span class="pill ${s.pilot_cancel ? 'pill-bad' : s.attended ? 'pill-good' : 'pill-neutral'}">${escapeHtml(s.status || '—')}</span></td>
          <td>${fmtMinutes(s.start)}</td>
          <td>${fmtMinutes(s.arrival)}</td>
          <td><strong>${fmtNum(s.packages, 0)}</strong></td>
          <td>${s.target_productivity ? s.target_productivity + ' paqs' : '—'}</td>
          <td><span class="pill ${evalP.badgeClass}">${evalP.label}</span></td>
          <td>${s.low_demand ? '<span class="pill pill-warn">⚠ Baja demanda</span>' : '<span class="pill pill-neutral">Normal</span>'}</td>
        </tr>
      `;
    }).join('');
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
    <div style="padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);" onclick="selectPilotForProfile('${escapeHtml(p.pilot)}'); document.getElementById('profileSearchDropdown').style.display='none';">
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

// Exportación CSV
function exportToCsv() {
  const headers = ['Fecha', 'Punto', 'Dia', 'Piloto', 'Telefono', 'Estado', 'Inicio', 'Paquetes', 'Meta', 'Evaluacion'];
  const rows = [headers.join(',')];
  AppState.filteredMalla.slice(0, 1000).forEach(r => {
    const evalP = r.productivity_eval || evaluateProductivityMatch(r.packages, r.target_productivity);
    rows.push([
      `"${r.date || ''}"`,
      `"${(r.store || '').replace(/"/g, '""')}"`,
      `"${r.weekday || ''}"`,
      `"${(r.pilot || '').replace(/"/g, '""')}"`,
      `"${r.phone || ''}"`,
      `"${r.status || ''}"`,
      fmtMinutes(r.start),
      r.packages || 0,
      r.target_productivity || '',
      `"${evalP.label}"`
    ].join(','));
  });

  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_TaDa_Productividad_${new Date().toISOString().substring(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

document.addEventListener('DOMContentLoaded', initApp);
