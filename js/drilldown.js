/**
 * ============================================================
 * DRILLDOWN ENGINE & CONTROLLER — PIBOX TADA DASHBOARD
 * Motor interactivo de consulta detallada para Tarjetas y Tablas
 * ============================================================
 */

const DrilldownEngine = {
  // Estado interno de la consulta modal activa
  currentContext: null,
  filteredRecords: [],
  groupedDates: [],
  expandedDates: new Set(),
  datePageMap: {},
  datePageSize: 15,
  lastPeriodContext: null,
  filtersExpanded: false,

  /**
   * Identifica si un turno es una cancelación computable (Piloto Cancela o Cliente Cancela)
   */
  isCancellationRecord(s) {
    if (!s) return false;
    const st = String(s.status || '').toLowerCase().trim();
    const isPilot = (
      st === 'piloto cancela' ||
      st === 'cancela piloto' ||
      st === 'piloto canceló' ||
      st === 'piloto cancelo' ||
      (st.includes('piloto') && st.includes('cancel')) ||
      Boolean(s.pilot_cancel)
    );
    const isClient = (
      st === 'cliente cancela' ||
      st === 'cancela cliente' ||
      st === 'cliente canceló' ||
      st === 'cliente cancelo' ||
      (st.includes('cliente') && st.includes('cancel'))
    );
    return isPilot || isClient;
  },

  /**
   * Obtiene la clasificación detallada de un registro dentro del contexto de cupos
   */
  getShiftCategory(s, matchResult = null) {
    const st = String(s.status || '').toLowerCase().trim();

    if (st.includes('tienda cerrada') || st === 'cerrada' || st.includes('adicional no autoriz') || st === 'adicional autorizado' || st.includes('adicional cancel')) {
      return { type: 'excluded', label: 'Excluido Operativamente', badgeClass: 'pill-neutral' };
    }

    if (st === 'reemplazo') {
      return { type: 'replacement', label: 'Reemplazo (Suplente)', badgeClass: 'pill-info' };
    }

    if (this.isCancellationRecord(s)) {
      return { type: 'cancellation', label: 'Cancelación Operativa', badgeClass: 'pill-danger' };
    }

    if (st === 'no programado') {
      return { type: 'no_programado', label: 'No Programado', badgeClass: 'pill-warning' };
    }

    const pName = String(s.pilot || '').trim().toLowerCase();
    const hasPilot = Boolean(
      (s.pilot && pName !== '' && pName !== '—' && pName !== 'sin asignar' && pName !== 'sin piloto') ||
      (s.pilot_id && String(s.pilot_id).trim() !== '' && String(s.pilot_id).trim() !== '—')
    );

    if (s.is_vacant || st === 'cupo faltante' || st === 'sin piloto' || st === 'vacante' || (!hasPilot && !s.attended)) {
      return { type: 'vacant', label: 'Vacante / Sin Piloto', badgeClass: 'pill-danger' };
    }

    if (s.attended) {
      return { type: 'attended', label: 'Asistido / Cubierto', badgeClass: 'pill-success' };
    }

    return { type: 'other', label: s.status || 'Registrado', badgeClass: 'pill-neutral' };
  },

  /**
   * Resuelve el periodo y filtros globales activos del dashboard sin cargar histórico fuera de rango
   */
  getActivePeriodContext(options = {}) {
    if (typeof AppState === 'undefined') {
      return { shifts: [], periodLabel: 'Periodo activo', startDate: '', endDate: '' };
    }

    const getDomVal = (id) => (typeof document !== 'undefined' ? (document.getElementById(id)?.value || '') : '');
    const fromRaw = getDomVal('filterFrom');
    const toRaw = getDomVal('filterTo');
    const fromIso = typeof parseHybridDate === 'function' ? parseHybridDate(fromRaw) : fromRaw;
    const toIso = typeof parseHybridDate === 'function' ? parseHybridDate(toRaw) : toRaw;
    const globalCity = getDomVal('filterCity');
    const globalStore = getDomVal('filterStore');
    const globalPilot = getDomVal('filterPilot').trim().toLowerCase();

    if (options.scope === 'modulo3') {
      const weeks = (AppState.availableWeeks && AppState.availableWeeks.length > 0)
        ? AppState.availableWeeks
        : [];
      const weekKeyOrObj = AppState.selectedModulo3Week;
      let selW = null;
      if (weekKeyOrObj && typeof weekKeyOrObj === 'object') {
        selW = weekKeyOrObj;
      } else if (typeof weekKeyOrObj === 'string') {
        selW = weeks.find(w => w.weekKey === weekKeyOrObj) || null;
      }

      let startDate = selW ? selW.startDate : '';
      let endDate = selW ? selW.endDate : '';

      // Si también hay rango global en los DatePickers, respetar la intersección más estricta
      if (fromIso) startDate = (!startDate || fromIso > startDate) ? fromIso : startDate;
      if (toIso) endDate = (!endDate || toIso < endDate) ? toIso : endDate;

      const shifts = (AppState.mallaShifts || []).filter(s => {
        if (globalCity && s.city !== globalCity) return false;
        if (globalStore && s.store !== globalStore) return false;
        if (globalPilot) {
          const matchP = (s.pilot || '').toLowerCase().includes(globalPilot);
          const matchId = (s.pilot_id || '').toLowerCase().includes(globalPilot);
          if (!matchP && !matchId) return false;
        }
        if (startDate || endDate) {
          if (typeof isDateInRangeWithNoonCut === 'function') {
            return isDateInRangeWithNoonCut(s.date, startDate, endDate);
          }
          if (startDate && s.date < startDate) return false;
          if (endDate && s.date > endDate) return false;
        }
        return true;
      });

      const periodLabel = selW && selW.label
        ? `${selW.label} (${startDate} al ${endDate})`
        : (startDate || endDate ? `Periodo: ${startDate || '...'} al ${endDate || '...'}` : 'Semana activa Módulo 3');

      return { shifts, periodLabel, startDate, endDate };
    }

    // Módulo 1 y consultas generales: heredar estrictamente AppState.filteredMalla (nunca caer al histórico completo si hay 0 resultados)
    const shifts = Array.isArray(AppState.filteredMalla)
      ? AppState.filteredMalla
      : (AppState.mallaShifts || []);

    let periodLabel = 'Periodo activo del dashboard';
    if (fromIso && toIso && fromIso === toIso) {
      periodLabel = `Jornada: ${fromIso}`;
    } else if (fromIso || toIso) {
      periodLabel = `Periodo: ${fromIso || '...'} al ${toIso || '...'}`;
    } else {
      const semanaEl = typeof document !== 'undefined' ? document.getElementById('filterSemana') : null;
      if (semanaEl && semanaEl.value && semanaEl.selectedIndex >= 0) {
        periodLabel = semanaEl.options[semanaEl.selectedIndex].text || periodLabel;
      }
    }

    return { shifts, periodLabel, startDate: fromIso || '', endDate: toIso || '' };
  },

  /**
   * Calcula el conjunto estricto de registros para cada tipo de consulta
   */
  resolveSourceRecords(type, options = {}) {
    const periodCtx = this.getActivePeriodContext(options);
    this.lastPeriodContext = periodCtx;
    const baseShifts = periodCtx.shifts;

    // Filtrar según el tipo de drill-down
    switch (type) {
      case 'card_cancellations': {
        // Tarjeta 2: Tasa de Cancelación (todos los turnos cancelados en el periodo activo)
        // Corresponde a los cancelados de reconcileShiftsMatch
        return baseShifts.filter(s => this.isCancellationRecord(s)).map(s => {
          const st = String(s.status || '').toLowerCase().trim();
          const isPilot = (st.includes('piloto') && st.includes('cancel')) || Boolean(s.pilot_cancel);
          return {
            ...s,
            _drilldownReason: isPilot ? 'Cancelación de Piloto' : 'Cancelación de Cliente',
            _drilldownBadge: isPilot ? 'badge-rose' : 'badge-amber'
          };
        });
      }

      case 'card_vacancies': {
        // Tarjeta 4: Cupos Faltantes (Vacantes reales)
        // Regla estricta: turnos que quedaron sin cubrir (cancelados sin reemplazo + no programado + sin piloto)
        // Se ejecuta el reconcileShiftsMatch para identificar con exactitud qué cancelados tuvieron suplente en su mismo slot
        const match = typeof reconcileShiftsMatch === 'function' ? reconcileShiftsMatch(baseShifts) : null;
        const groups = match ? match.groups : {};

        const results = [];

        // Para cada grupo (Fecha + Tienda + Horario)
        Object.values(groups).forEach(g => {
          const cancelsInGroup = g.shifts.filter(s => this.isCancellationRecord(s));
          const replacementsInGroup = g.shifts.filter(s => String(s.status || '').toLowerCase().trim() === 'reemplazo');

          const matchedCount = Math.min(cancelsInGroup.length, replacementsInGroup.length);

          // Los primeros matchedCount cancelados se consideran "Cubiertos con Reemplazo"
          // Los restantes son "Cancelados Sin Reemplazo (Vacante Operativa)"
          cancelsInGroup.forEach((s, idx) => {
            const hasMatch = idx < matchedCount;
            // Incluir el registro con su trazabilidad
            results.push({
              ...s,
              _drilldownReason: hasMatch ? 'Cancelado Cubierto con Reemplazo' : 'Cancelado Sin Reemplazo (Vacante)',
              _drilldownBadge: hasMatch ? 'badge-cyan' : 'badge-rose',
              _isUnmatchedVacancy: !hasMatch
            });
          });

          // Agregar también no programados y sin piloto
          g.shifts.forEach(s => {
            const st = String(s.status || '').toLowerCase().trim();
            if (st === 'no programado') {
              results.push({
                ...s,
                _drilldownReason: 'No Programado (Vacante)',
                _drilldownBadge: 'badge-rose',
                _isUnmatchedVacancy: true
              });
            } else {
              const pName = String(s.pilot || '').trim().toLowerCase();
              const hasPilot = Boolean(
                (s.pilot && pName !== '' && pName !== '—' && pName !== 'sin asignar' && pName !== 'sin piloto') ||
                (s.pilot_id && String(s.pilot_id).trim() !== '' && String(s.pilot_id).trim() !== '—')
              );
              if (!hasPilot && !s.attended && !this.isCancellationRecord(s) && st !== 'no programado' && !st.includes('tienda cerrada')) {
                results.push({
                  ...s,
                  _drilldownReason: 'Cupo Sin Piloto Asignado (Vacante)',
                  _drilldownBadge: 'badge-rose',
                  _isUnmatchedVacancy: true
                });
              }
            }
          });
        });

        // Ordenar: primero las vacantes reales (sin reemplazo)
        return results.sort((a, b) => (b._isUnmatchedVacancy ? 1 : 0) - (a._isUnmatchedVacancy ? 1 : 0));
      }

      case 'table_store_coverage': {
        // Clic en fila de la tabla Cobertura por Tienda
        const storeName = options.store;
        const targetCity = options.city;
        return baseShifts.filter(s => {
          if (storeName && s.store !== storeName) return false;
          if (targetCity && s.city !== targetCity) return false;
          return true;
        }).map(s => {
          const cat = this.getShiftCategory(s);
          return {
            ...s,
            _drilldownReason: cat.label,
            _drilldownBadge: cat.type === 'attended' ? 'badge-emerald' : (cat.type === 'replacement' ? 'badge-cyan' : (cat.type === 'cancellation' ? 'badge-rose' : 'badge-muted'))
          };
        });
      }

      case 'table_daily_radiography': {
        // Clic en día de la Radiografía Diaria (Lunes, Martes, etc.)
        const targetWeekday = options.weekday;
        return baseShifts.filter(s => {
          const cDay = typeof canonicalizeWeekday === 'function' ? canonicalizeWeekday(s.weekday, s.date) : s.weekday;
          return cDay === targetWeekday;
        }).map(s => {
          const cat = this.getShiftCategory(s);
          return {
            ...s,
            _drilldownReason: cat.label,
            _drilldownBadge: cat.type === 'attended' ? 'badge-emerald' : (cat.type === 'replacement' ? 'badge-cyan' : (cat.type === 'cancellation' ? 'badge-rose' : 'badge-muted'))
          };
        });
      }

      case 'table_city_store_performance': {
        // Clic en fila de Desempeño Operativo por Ciudad o Tienda
        const targetCity = options.city;
        const targetStore = options.store;
        return baseShifts.filter(s => {
          if (targetCity && (s.city || '').toLowerCase() !== targetCity.toLowerCase()) return false;
          if (targetStore && (s.store || '').toLowerCase() !== targetStore.toLowerCase()) return false;
          return true;
        }).map(s => {
          const cat = this.getShiftCategory(s);
          return {
            ...s,
            _drilldownReason: cat.label,
            _drilldownBadge: cat.type === 'attended' ? 'badge-emerald' : (cat.type === 'replacement' ? 'badge-cyan' : (cat.type === 'cancellation' ? 'badge-rose' : 'badge-muted'))
          };
        });
      }

      default:
        return baseShifts;
    }
  },

  /**
   * Abre la ventana modal con el contexto y los filtros iniciales
   */
  openModal({ type, title, subtitle, icon = '🔍', options = {} }) {
    const overlay = document.getElementById('drilldownModalOverlay');
    if (!overlay) return;

    // Resolver registros base
    const rawRecords = this.resolveSourceRecords(type, options);

    this.currentContext = {
      type,
      title,
      subtitle,
      icon,
      options,
      rawRecords,
      filters: {
        date: '',
        weekday: options.weekday || '',
        city: options.city || '',
        store: options.store || '',
        hour: '',
        status: options.initialStatusFilter || '',
        category: ''
      }
    };

    this.expandedDates = new Set();
    this.datePageMap = {};

    // Actualizar Header y Badge de Periodo Heredado
    const titleEl = document.getElementById('drilldownModalTitle');
    const subtitleEl = document.getElementById('drilldownModalSubtitle');
    const iconEl = document.getElementById('drilldownModalIcon');
    const periodEl = document.getElementById('drilldownPeriodBadge');
    if (titleEl) titleEl.innerText = title;
    if (subtitleEl) subtitleEl.innerText = subtitle;
    if (iconEl) iconEl.innerText = icon;
    if (periodEl) {
      const pLabel = this.lastPeriodContext?.periodLabel || '';
      if (pLabel) {
        periodEl.textContent = `📅 ${pLabel}`;
        periodEl.style.display = 'inline-flex';
      } else {
        periodEl.style.display = 'none';
      }
    }

    // Colapsar panel de filtros por defecto y adaptar al contexto
    this.setFiltersExpanded(false);
    this.adaptFiltersToContext();

    // Llenar selectores desplegables
    this.populateFilters();

    // Aplicar filtros y renderizar
    this.applyInternalFilters();

    // Mostrar ventana
    overlay.classList.add('active');
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  /**
   * Expande o colapsa la barra de filtros internos
   */
  setFiltersExpanded(expanded) {
    this.filtersExpanded = Boolean(expanded);
    const bar = document.getElementById('drilldownFiltersBar');
    const btn = document.getElementById('btnDrilldownToggleFilters');
    const arrow = document.getElementById('ddFilterToggleArrow');
    if (bar) bar.style.display = this.filtersExpanded ? 'flex' : 'none';
    if (btn) btn.classList.toggle('active', this.filtersExpanded);
    if (arrow) arrow.textContent = this.filtersExpanded ? '▴' : '▾';
  },

  /**
   * Adapta qué filtros son visibles según el origen de la consulta
   */
  adaptFiltersToContext() {
    if (!this.currentContext) return;
    const type = this.currentContext.type;
    const grpDay = document.getElementById('ddGroupDay');
    const grpCategory = document.getElementById('ddGroupCategory');
    const lblCategory = document.getElementById('ddLabelCategory');

    if (grpDay) {
      grpDay.style.display = (type === 'card_vacancies' || type === 'table_daily_radiography') ? 'none' : 'flex';
    }

    if (grpCategory) {
      if (type === 'card_cancellations') {
        grpCategory.style.display = 'flex';
        if (lblCategory) lblCategory.textContent = '🏷️ Tipo Cancelación';
      } else if (type === 'card_vacancies') {
        grpCategory.style.display = 'flex';
        if (lblCategory) lblCategory.textContent = '🏷️ Cobertura Vacante';
      } else {
        grpCategory.style.display = 'none';
      }
    }
  },

  /**
   * Cierra la ventana modal y limpia el estado
   */
  closeModal() {
    const overlay = document.getElementById('drilldownModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }, 200);
  },

  /**
   * Llena las opciones de los filtros internos desplegables de la ventana
   */
  populateFilters() {
    if (!this.currentContext) return;
    const records = this.currentContext.rawRecords;

    const selectDate = document.getElementById('ddFilterDate');
    const selectDay = document.getElementById('ddFilterDay');
    const selectCity = document.getElementById('ddFilterCity');
    const selectStore = document.getElementById('ddFilterStore');
    const selectHour = document.getElementById('ddFilterHour');

    // Fechas únicas ordenadas
    const dates = [...new Set(records.map(r => r.date).filter(Boolean))].sort();
    if (selectDate) {
      selectDate.innerHTML = '<option value="">Todas las Fechas</option>' +
        dates.map(d => `<option value="${d}">${d}</option>`).join('');
      selectDate.value = this.currentContext.filters.date || '';
    }

    // Días de la semana
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const presentDays = [...new Set(records.map(r => typeof canonicalizeWeekday === 'function' ? canonicalizeWeekday(r.weekday, r.date) : r.weekday).filter(Boolean))];
    if (selectDay) {
      selectDay.innerHTML = '<option value="">Todos los Días</option>' +
        dayOrder.filter(d => presentDays.includes(d)).map(d => `<option value="${d}">${d}</option>`).join('');
      selectDay.value = this.currentContext.filters.weekday || '';
    }

    // Ciudades únicas
    const cities = [...new Set(records.map(r => r.city).filter(Boolean))].sort();
    if (selectCity) {
      selectCity.innerHTML = '<option value="">Todas las Ciudades</option>' +
        cities.map(c => `<option value="${c}">${c}</option>`).join('');
      selectCity.value = this.currentContext.filters.city || '';
    }

    // Tiendas (coordinadas con la ciudad seleccionada)
    this.updateStoreDropdown();

    // Horas de inicio (franjas horarias)
    const hours = [...new Set(records.map(r => {
      if (r.start != null) {
        return typeof fmtMinutes === 'function' ? fmtMinutes(r.start) : `${Math.floor(r.start/60)}:00`;
      }
      return null;
    }).filter(Boolean))].sort();

    if (selectHour) {
      selectHour.innerHTML = '<option value="">Todas las Horas</option>' +
        hours.map(h => `<option value="${h}">${h}</option>`).join('');
      selectHour.value = this.currentContext.filters.hour || '';
    }

    // Filtro contextual por categoría (solo en Cancelaciones y Vacantes)
    const selectCat = document.getElementById('ddFilterCategory');
    if (selectCat) {
      const type = this.currentContext.type;
      if (type === 'card_cancellations') {
        selectCat.innerHTML = '<option value="">Todas</option>' +
          '<option value="Cancelación de Piloto">Cancelación de Piloto</option>' +
          '<option value="Cancelación de Cliente">Cancelación de Cliente</option>';
      } else if (type === 'card_vacancies') {
        selectCat.innerHTML = '<option value="">Todas</option>' +
          '<option value="unmatched">Sin Cubrir (Vacante)</option>' +
          '<option value="matched">Cubierto con Reemplazo</option>';
      } else {
        selectCat.innerHTML = '<option value="">Todas</option>';
      }
      selectCat.value = this.currentContext.filters.category || '';
    }
  },

  /**
   * Actualiza el desplegable de tiendas respetando la ciudad seleccionada
   */
  updateStoreDropdown() {
    if (!this.currentContext) return;
    const records = this.currentContext.rawRecords;
    const selectStore = document.getElementById('ddFilterStore');
    if (!selectStore) return;

    const selectedCity = this.currentContext.filters.city;
    const availableStores = [...new Set(
      records
        .filter(r => !selectedCity || (r.city || '').toLowerCase() === selectedCity.toLowerCase())
        .map(r => r.store)
        .filter(Boolean)
    )].sort();

    const currentVal = this.currentContext.filters.store;
    selectStore.innerHTML = '<option value="">Todas las Tiendas</option>' +
      availableStores.map(st => `<option value="${escapeHtml(st)}"${st === currentVal ? ' selected' : ''}>${escapeHtml(st.split(' - ')[0])}</option>`).join('');
  },

  /**
   * Aplica los filtros internos coordinados y recalcula la tabla y resumen
   */
  applyInternalFilters() {
    if (!this.currentContext) return;
    const { rawRecords, filters } = this.currentContext;

    this.filteredRecords = rawRecords.filter(r => {
      // Filtro Fecha
      if (filters.date && r.date !== filters.date) return false;

      // Filtro Día
      if (filters.weekday) {
        const cDay = typeof canonicalizeWeekday === 'function' ? canonicalizeWeekday(r.weekday, r.date) : r.weekday;
        if (cDay !== filters.weekday) return false;
      }

      // Filtro Ciudad
      if (filters.city && (r.city || '').toLowerCase() !== filters.city.toLowerCase()) return false;

      // Filtro Tienda
      if (filters.store && (r.store || '').toLowerCase() !== filters.store.toLowerCase()) return false;

      // Filtro Hora
      if (filters.hour) {
        const hStr = typeof fmtMinutes === 'function' ? fmtMinutes(r.start) : `${Math.floor((r.start||0)/60)}:00`;
        if (hStr !== filters.hour) return false;
      }

      // Filtro Contextual (Tipo de Cancelación / Cobertura Vacante)
      if (filters.category) {
        if (this.currentContext.type === 'card_cancellations') {
          if (r._drilldownReason !== filters.category) return false;
        } else if (this.currentContext.type === 'card_vacancies') {
          if (filters.category === 'unmatched' && !r._isUnmatchedVacancy) return false;
          if (filters.category === 'matched' && r._isUnmatchedVacancy) return false;
        }
      }

      return true;
    });

    this.expandedDates = new Set();
    this.datePageMap = {};
    this.groupRecordsByDate();
    this.renderActiveFilterChips();
    this.renderSummaryStrip();
    this.renderAccordionList();
    this.renderFooter();
  },

  /**
   * Renderiza chips removibles de filtros activos en la barra compacta
   */
  renderActiveFilterChips() {
    const chipsContainer = document.getElementById('ddActiveFilterChips');
    const clearBtn = document.getElementById('btnDrilldownClear');
    if (!chipsContainer || !this.currentContext) return;

    const f = this.currentContext.filters;
    const labels = [
      { key: 'date', label: 'Fecha', val: f.date },
      { key: 'weekday', label: 'Día', val: f.weekday },
      { key: 'city', label: 'Ciudad', val: f.city },
      { key: 'store', label: 'Tienda', val: f.store ? f.store.split(' - ')[0] : '' },
      { key: 'hour', label: 'Hora', val: f.hour },
      {
        key: 'category',
        label: this.currentContext.type === 'card_vacancies' ? 'Cobertura' : 'Tipo',
        val: f.category === 'unmatched' ? 'Sin Cubrir' : (f.category === 'matched' ? 'Con Reemplazo' : f.category)
      }
    ].filter(item => Boolean(item.val));

    if (clearBtn) {
      clearBtn.style.display = labels.length > 0 ? 'inline-flex' : 'none';
    }

    if (labels.length === 0) {
      chipsContainer.innerHTML = '<span style="font-size:0.72rem;color:var(--text-muted);opacity:0.8;">Sin filtros adicionales activos</span>';
      return;
    }

    chipsContainer.innerHTML = labels.map(item => `
      <span class="drilldown-active-chip">
        ${escapeHtml(item.label)}: <strong>${escapeHtml(item.val)}</strong>
        <button type="button" onclick="DrilldownEngine.removeFilter('${item.key}')" title="Quitar filtro">✕</button>
      </span>
    `).join('');
  },

  /**
   * Quita un filtro individual desde su chip activo
   */
  removeFilter(key) {
    if (!this.currentContext) return;
    this.currentContext.filters[key] = '';
    if (key === 'city') {
      this.currentContext.filters.store = '';
    }
    this.populateFilters();
    this.applyInternalFilters();
  },

  /**
   * Renderiza el resumen de resultados en la franja superior
   */
  renderSummaryStrip() {
    const container = document.getElementById('drilldownSummaryStrip');
    if (!container || !this.currentContext) return;

    const total = this.filteredRecords.length;
    const totalOriginal = this.currentContext.rawRecords.length;

    // Conteos por estado en el conjunto filtrado
    let cancelCount = 0;
    let replacementCount = 0;
    let vacancyCount = 0;
    let coveredCount = 0;

    this.filteredRecords.forEach(r => {
      if (r._isUnmatchedVacancy) vacancyCount++;
      else if (this.isCancellationRecord(r)) cancelCount++;
      else if (String(r.status || '').toLowerCase().trim() === 'reemplazo') replacementCount++;
      else if (r.attended) coveredCount++;
    });

    const isFiltered = total !== totalOriginal;
    const datesCount = this.groupedDates.length;

    container.innerHTML = `
      <div class="drilldown-summary-chip chip-count">
        <span>📋</span> Total: <strong>${total.toLocaleString()}</strong> ${isFiltered ? `<span style="opacity:0.75;font-size:0.7rem;">(de ${totalOriginal})</span>` : ''}
      </div>
      <div class="drilldown-summary-chip">
        <span>📅</span> Fechas: <strong>${datesCount}</strong>
      </div>
      ${vacancyCount > 0 ? `
        <div class="drilldown-summary-chip" style="border-color:rgba(239,68,68,0.4); background:rgba(239,68,68,0.12); color:#fca5a5;">
          <span>⚠️</span> Vacantes Sin Cubrir: <strong>${vacancyCount}</strong>
        </div>
      ` : ''}
      ${cancelCount > 0 ? `
        <div class="drilldown-summary-chip" style="border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.08); color:#f87171;">
          <span>🚫</span> Cancelaciones: <strong>${cancelCount}</strong>
        </div>
      ` : ''}
      ${replacementCount > 0 ? `
        <div class="drilldown-summary-chip" style="border-color:rgba(6,182,212,0.3); background:rgba(6,182,212,0.08); color:#22d3ee;">
          <span>🔄</span> Reemplazos: <strong>${replacementCount}</strong>
        </div>
      ` : ''}
      ${coveredCount > 0 ? `
        <div class="drilldown-summary-chip" style="border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.08); color:#6ee7b7;">
          <span>✅</span> Asistidos / Titulares: <strong>${coveredCount}</strong>
        </div>
      ` : ''}
    `;
  },

  /**
   * Formatea una fecha ISO (YYYY-MM-DD) en formato legible en español
   */
  formatSpanishDate(isoDate) {
    if (!isoDate || isoDate.length < 10) return isoDate || 'Sin Fecha';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const mIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(mIdx) || mIdx < 0 || mIdx > 11 || isNaN(day)) return isoDate;
    return `${day} de ${months[mIdx]} de ${parts[0]}`;
  },

  /**
   * Agrupa los registros filtrados cronológicamente por fecha
   */
  groupRecordsByDate() {
    const map = new Map();
    this.filteredRecords.forEach(r => {
      const dateKey = r.date || 'Sin Fecha';
      if (!map.has(dateKey)) {
        const wDay = typeof canonicalizeWeekday === 'function' ? canonicalizeWeekday(r.weekday, r.date) : (r.weekday || '');
        map.set(dateKey, { date: dateKey, weekday: wDay, records: [] });
      }
      map.get(dateKey).records.push(r);
    });

    this.groupedDates = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    return this.groupedDates;
  },

  /**
   * Define las columnas compactas dentro de cada fecha desplegada
   */
  getColumnConfig(type) {
    const base = [
      { key: 'idx', label: '#', style: 'width: 38px; text-align: center;' },
      { key: 'start', label: 'Hora', style: 'min-width: 65px; text-align: center;' },
      { key: 'city', label: 'Ciudad', style: 'min-width: 90px;' },
      { key: 'store', label: 'Tienda / Punto', style: 'min-width: 165px;' },
      { key: 'pilot', label: 'Piloto / ID', style: 'min-width: 150px;' },
      { key: 'status', label: 'Estado', style: 'min-width: 105px; text-align: center;' }
    ];

    if (type === 'card_cancellations') {
      return [
        ...base,
        { key: 'reason', label: 'Tipo Cancelación', style: 'min-width: 145px; text-align: center;' }
      ];
    }

    if (type === 'card_vacancies') {
      return [
        ...base,
        { key: 'reason', label: 'Cobertura / Match', style: 'min-width: 165px; text-align: center;' }
      ];
    }

    return [
      ...base,
      { key: 'reason', label: 'Clasificación', style: 'min-width: 135px; text-align: center;' }
    ];
  },

  /**
   * Renderiza la lista de fechas contraídas en orden cronológico
   */
  renderAccordionList() {
    const container = document.getElementById('drilldownAccordionContainer');
    if (!container) return;

    if (this.groupedDates.length === 0) {
      container.innerHTML = `
        <div class="drilldown-empty-state">
          <div class="empty-icon">🔎</div>
          <h4>No se encontraron registros</h4>
          <p>No hay turnos dentro del periodo y filtros seleccionados para esta consulta.</p>
        </div>
      `;
      return;
    }

    const type = this.currentContext?.type;

    container.innerHTML = this.groupedDates.map(group => {
      const safeDateId = group.date.replace(/[^a-zA-Z0-9_-]/g, '_');
      const isExpanded = this.expandedDates.has(group.date);
      const count = group.records.length;
      const label = this.formatSpanishDate(group.date);

      // Mini-resumen contextual por fecha
      let extraMeta = '';
      if (type === 'card_vacancies') {
        const unmatched = group.records.filter(r => r._isUnmatchedVacancy).length;
        const matched = count - unmatched;
        if (unmatched > 0) extraMeta += `<span class="table-pct-badge badge-rose" style="font-size:0.7rem;">${unmatched} sin cubrir</span>`;
        if (matched > 0) extraMeta += `<span class="table-pct-badge badge-cyan" style="font-size:0.7rem;">${matched} con reemplazo</span>`;
      } else if (type === 'card_cancellations') {
        const pilotC = group.records.filter(r => r._drilldownReason === 'Cancelación de Piloto').length;
        const clientC = count - pilotC;
        if (pilotC > 0) extraMeta += `<span class="table-pct-badge badge-rose" style="font-size:0.7rem;">${pilotC} piloto</span>`;
        if (clientC > 0) extraMeta += `<span class="table-pct-badge badge-amber" style="font-size:0.7rem;">${clientC} cliente</span>`;
      }

      return `
        <div class="drilldown-date-group ${isExpanded ? 'expanded' : ''}" id="ddGroup_${safeDateId}">
          <button type="button" class="drilldown-date-header" onclick="DrilldownEngine.toggleDateGroup('${escapeHtml(group.date)}')">
            <div class="drilldown-date-title-wrap">
              <span>📅</span>
              <span class="drilldown-date-label">${escapeHtml(label)}</span>
              ${group.weekday ? `<span class="pill pill-neutral" style="font-size:0.7rem;">${escapeHtml(group.weekday)}</span>` : ''}
            </div>
            <div class="drilldown-date-meta">
              ${extraMeta}
              <span class="drilldown-date-count">${count} ${count === 1 ? 'registro' : 'registros'}</span>
              <span class="drilldown-date-chevron">▸</span>
            </div>
          </button>
          <div class="drilldown-date-body" id="ddBody_${safeDateId}">
            ${isExpanded ? this.buildDateBodyHtml(group.date) : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Despliega o contrae una fecha bajo demanda
   */
  toggleDateGroup(dateKey) {
    const safeDateId = dateKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const groupEl = document.getElementById(`ddGroup_${safeDateId}`);
    const bodyEl = document.getElementById(`ddBody_${safeDateId}`);

    if (this.expandedDates.has(dateKey)) {
      this.expandedDates.delete(dateKey);
      if (groupEl) groupEl.classList.remove('expanded');
    } else {
      this.expandedDates.add(dateKey);
      if (!this.datePageMap[dateKey]) this.datePageMap[dateKey] = 1;
      if (bodyEl) bodyEl.innerHTML = this.buildDateBodyHtml(dateKey);
      if (groupEl) groupEl.classList.add('expanded');
    }
  },

  /**
   * Construye la tabla compacta (y paginación interna si aplica) para una sola fecha
   */
  buildDateBodyHtml(dateKey) {
    const group = this.groupedDates.find(g => g.date === dateKey);
    if (!group || group.records.length === 0) return '';

    const cols = this.getColumnConfig(this.currentContext?.type);
    const total = group.records.length;
    const totalPages = Math.ceil(total / this.datePageSize) || 1;
    const curPage = Math.max(1, Math.min(this.datePageMap[dateKey] || 1, totalPages));
    this.datePageMap[dateKey] = curPage;

    const startIdx = (curPage - 1) * this.datePageSize;
    const pageRecords = group.records.slice(startIdx, startIdx + this.datePageSize);

    const rowsHtml = pageRecords.map((r, i) => {
      const idxLocal = startIdx + i + 1;
      const startStr = (r.start != null) ? (typeof fmtMinutes === 'function' ? fmtMinutes(r.start) : `${Math.floor(r.start/60)}:00`) : '—';
      const pilotName = r.pilot && String(r.pilot).trim() !== '' ? r.pilot : (r.pilot_id || 'Sin Asignar');
      const storeShort = (r.store || 'Sin Tienda').split(' - ')[0];
      const statusBadge = r.status ? `<span class="pill pill-neutral">${escapeHtml(r.status)}</span>` : '<span class="pill pill-danger">Sin Estado</span>';
      const reasonBadge = r._drilldownReason
        ? `<span class="table-pct-badge ${r._drilldownBadge || 'badge-muted'}" style="font-size:0.72rem;">${escapeHtml(r._drilldownReason)}</span>`
        : statusBadge;

      const cellMap = {
        idx: `<td style="text-align:center;color:var(--text-muted);font-size:0.72rem;">${idxLocal}</td>`,
        start: `<td style="text-align:center;font-weight:700;color:#a78bfa;">${startStr}</td>`,
        city: `<td style="white-space:nowrap;"><strong>${escapeHtml(r.city || '—')}</strong></td>`,
        store: `<td style="max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(r.store || '')}">${escapeHtml(storeShort)}</td>`,
        pilot: `<td style="max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(pilotName)}">${escapeHtml(pilotName)}</td>`,
        status: `<td style="text-align:center;">${statusBadge}</td>`,
        reason: `<td style="text-align:center;">${reasonBadge}</td>`
      };

      return `<tr>${cols.map(c => cellMap[c.key] || '').join('')}</tr>`;
    }).join('');

    const paginationHtml = totalPages > 1 ? `
      <div class="drilldown-date-pagination">
        <span>Mostrando ${startIdx + 1}–${Math.min(startIdx + this.datePageSize, total)} de ${total}</span>
        <div class="drilldown-pagination-controls">
          <button type="button" class="drilldown-page-btn" ${curPage <= 1 ? 'disabled' : ''} onclick="DrilldownEngine.goToDatePage('${escapeHtml(dateKey)}', ${curPage - 1})">Anterior</button>
          <span style="padding:0 6px;font-weight:700;color:#c4b5fd;">${curPage} / ${totalPages}</span>
          <button type="button" class="drilldown-page-btn" ${curPage >= totalPages ? 'disabled' : ''} onclick="DrilldownEngine.goToDatePage('${escapeHtml(dateKey)}', ${curPage + 1})">Siguiente</button>
        </div>
      </div>
    ` : '';

    return `
      <div class="drilldown-table-wrapper">
        <table class="drilldown-table">
          <thead><tr>${cols.map(c => `<th style="${c.style}">${c.label}</th>`).join('')}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      ${paginationHtml}
    `;
  },

  /**
   * Pagina internamente dentro de una fecha desplegada sin recargar las demás
   */
  goToDatePage(dateKey, page) {
    this.datePageMap[dateKey] = page;
    const safeDateId = dateKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const bodyEl = document.getElementById(`ddBody_${safeDateId}`);
    if (bodyEl) bodyEl.innerHTML = this.buildDateBodyHtml(dateKey);
  },

  /**
   * Renderiza el pie informativo de la consulta agrupada
   */
  renderFooter() {
    const footer = document.getElementById('drilldownModalFooter');
    if (!footer) return;
    const total = this.filteredRecords.length;
    const datesCount = this.groupedDates.length;
    footer.innerHTML = `
      <div>
        Mostrando <strong>${datesCount}</strong> ${datesCount === 1 ? 'fecha' : 'fechas'} · <strong>${total.toLocaleString()}</strong> ${total === 1 ? 'registro' : 'registros'} en total
      </div>
      <div style="font-size:0.74rem;color:var(--text-muted);">
        Haz clic en cualquier fecha para desplegar o contraer su detalle
      </div>
    `;
  },

  /**
   * Inicializa listeners de los filtros dentro de la modal
   */
  initModalListeners() {
    const overlay = document.getElementById('drilldownModalOverlay');
    const closeBtn = document.getElementById('btnDrilldownClose');
    const clearBtn = document.getElementById('btnDrilldownClear');
    const toggleBtn = document.getElementById('btnDrilldownToggleFilters');

    if (toggleBtn) {
      toggleBtn.onclick = () => this.setFiltersExpanded(!this.filtersExpanded);
    }

    if (closeBtn) closeBtn.onclick = () => this.closeModal();

    if (overlay) {
      overlay.onclick = (e) => {
        if (e.target === overlay) this.closeModal();
      };
    }

    // Tecla Escape para cerrar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
        this.closeModal();
      }
    });

    // Listeners de los filtros desplegables
    const selectDate = document.getElementById('ddFilterDate');
    const selectDay = document.getElementById('ddFilterDay');
    const selectCity = document.getElementById('ddFilterCity');
    const selectStore = document.getElementById('ddFilterStore');
    const selectHour = document.getElementById('ddFilterHour');
    const selectCat = document.getElementById('ddFilterCategory');

    if (selectDate) {
      selectDate.onchange = () => {
        if (this.currentContext) {
          this.currentContext.filters.date = selectDate.value;
          this.applyInternalFilters();
        }
      };
    }

    if (selectDay) {
      selectDay.onchange = () => {
        if (this.currentContext) {
          this.currentContext.filters.weekday = selectDay.value;
          this.applyInternalFilters();
        }
      };
    }

    if (selectCity) {
      selectCity.onchange = () => {
        if (this.currentContext) {
          this.currentContext.filters.city = selectCity.value;
          this.currentContext.filters.store = ''; // Reset tienda al cambiar ciudad
          this.updateStoreDropdown();
          this.applyInternalFilters();
        }
      };
    }

    if (selectStore) {
      selectStore.onchange = () => {
        if (this.currentContext) {
          this.currentContext.filters.store = selectStore.value;
          this.applyInternalFilters();
        }
      };
    }

    if (selectHour) {
      selectHour.onchange = () => {
        if (this.currentContext) {
          this.currentContext.filters.hour = selectHour.value;
          this.applyInternalFilters();
        }
      };
    }

    if (selectCat) {
      selectCat.onchange = () => {
        if (this.currentContext) {
          this.currentContext.filters.category = selectCat.value;
          this.applyInternalFilters();
        }
      };
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        if (this.currentContext) {
          this.currentContext.filters = { date: '', weekday: '', city: '', store: '', hour: '', status: '', category: '' };
          this.populateFilters();
          this.applyInternalFilters();
        }
      };
    }
  }
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.DrilldownEngine = DrilldownEngine;
}
if (typeof global !== 'undefined') {
  global.DrilldownEngine = DrilldownEngine;
}
