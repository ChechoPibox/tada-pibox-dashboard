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
  currentPage: 1,
  pageSize: 25,

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
   * Calcula el conjunto estricto de registros para cada tipo de consulta
   */
  resolveSourceRecords(type, options = {}) {
    // Tomar los turnos de la semana activa en Módulo 3 o AppState.filteredMalla
    let baseShifts = [];
    if (typeof AppState !== 'undefined') {
      if (options.scope === 'modulo3' && AppState.selectedModulo3Week) {
        const selW = AppState.selectedModulo3Week;
        baseShifts = AppState.mallaShifts.filter(s => {
          if (typeof isDateInRangeWithNoonCut === 'function') {
            return isDateInRangeWithNoonCut(s.date, selW.startDate, selW.endDate);
          }
          return s.date >= selW.startDate && s.date <= selW.endDate;
        });
      } else {
        baseShifts = (AppState.filteredMalla && AppState.filteredMalla.length > 0)
          ? AppState.filteredMalla
          : AppState.mallaShifts;
      }
    }

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
        status: options.initialStatusFilter || ''
      }
    };

    this.currentPage = 1;

    // Actualizar Header
    const titleEl = document.getElementById('drilldownModalTitle');
    const subtitleEl = document.getElementById('drilldownModalSubtitle');
    const iconEl = document.getElementById('drilldownModalIcon');
    if (titleEl) titleEl.innerText = title;
    if (subtitleEl) subtitleEl.innerText = subtitle;
    if (iconEl) iconEl.innerText = icon;

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

      return true;
    });

    this.currentPage = 1;
    this.renderSummaryStrip();
    this.renderTablePage();
    this.renderPagination();
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

    container.innerHTML = `
      <div class="drilldown-summary-chip chip-count">
        <span>📋</span> Total Registros: <strong>${total.toLocaleString()}</strong> ${isFiltered ? `<span style="opacity:0.75;font-size:0.7rem;">(de ${totalOriginal})</span>` : ''}
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
   * Renderiza la página actual de la tabla
   */
  renderTablePage() {
    const tbody = document.getElementById('drilldownTableBody');
    if (!tbody) return;

    if (this.filteredRecords.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10">
            <div class="drilldown-empty-state">
              <div class="empty-icon">🔎</div>
              <h4>No se encontraron registros</h4>
              <p>No hay turnos que coincidan con la combinación de filtros seleccionada dentro de esta consulta.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const pageRecords = this.filteredRecords.slice(startIdx, startIdx + this.pageSize);

    tbody.innerHTML = pageRecords.map((r, i) => {
      const idxGlobal = startIdx + i + 1;
      const startStr = (r.start != null) ? (typeof fmtMinutes === 'function' ? fmtMinutes(r.start) : `${Math.floor(r.start/60)}:00`) : '—';
      const hoursCount = (r.hours != null && !isNaN(r.hours) && r.hours > 0) ? `${r.hours}h` : '8h';
      const packagesCount = (r.packages != null && !isNaN(r.packages)) ? r.packages : 0;

      const pilotName = r.pilot && String(r.pilot).trim() !== '' ? r.pilot : (r.pilot_id || 'Sin Asignar');
      const storeShort = (r.store || 'Sin Tienda').split(' - ')[0];

      // Formateo de fecha y día
      const weekdayStr = typeof canonicalizeWeekday === 'function' ? canonicalizeWeekday(r.weekday, r.date) : (r.weekday || '—');

      // Badges
      const statusBadge = r.status ? `<span class="pill pill-neutral">${escapeHtml(r.status)}</span>` : '<span class="pill pill-danger">Sin Estado</span>';
      const reasonBadge = r._drilldownReason
        ? `<span class="table-pct-badge ${r._drilldownBadge || 'badge-muted'}" style="font-size:0.72rem;">${escapeHtml(r._drilldownReason)}</span>`
        : statusBadge;

      return `
        <tr>
          <td style="text-align:center;color:var(--text-muted);font-size:0.72rem;">${idxGlobal}</td>
          <td style="white-space:nowrap;font-weight:600;color:#fff;">${escapeHtml(r.date || '—')}</td>
          <td style="white-space:nowrap;"><span class="pill pill-neutral" style="font-size:0.7rem;">${escapeHtml(weekdayStr)}</span></td>
          <td style="white-space:nowrap;"><strong>${escapeHtml(r.city || '—')}</strong></td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(r.store || '')}">${escapeHtml(storeShort)}</td>
          <td style="text-align:center;font-weight:700;color:#a78bfa;">${startStr}</td>
          <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(pilotName)}">${escapeHtml(pilotName)}</td>
          <td style="text-align:center;">${statusBadge}</td>
          <td style="text-align:center;">${reasonBadge}</td>
          <td style="text-align:center;color:var(--text-muted);">${packagesCount} paq · ${hoursCount}</td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Renderiza los controles de paginación
   */
  renderPagination() {
    const footer = document.getElementById('drilldownModalFooter');
    if (!footer) return;

    const total = this.filteredRecords.length;
    const totalPages = Math.ceil(total / this.pageSize) || 1;

    const startIdx = total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const endIdx = Math.min(this.currentPage * this.pageSize, total);

    footer.innerHTML = `
      <div>
        Mostrando registros <strong>${startIdx}</strong> a <strong>${endIdx}</strong> de <strong>${total.toLocaleString()}</strong>
      </div>
      <div class="drilldown-pagination-controls">
        <button class="drilldown-page-btn" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="DrilldownEngine.goToPage(1)" title="Primera página">«</button>
        <button class="drilldown-page-btn" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="DrilldownEngine.goToPage(${this.currentPage - 1})">Anterior</button>
        <span style="padding:0 8px;font-weight:700;color:#c4b5fd;">Página ${this.currentPage} de ${totalPages}</span>
        <button class="drilldown-page-btn" ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="DrilldownEngine.goToPage(${this.currentPage + 1})">Siguiente</button>
        <button class="drilldown-page-btn" ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="DrilldownEngine.goToPage(${totalPages})" title="Última página">»</button>
      </div>
    `;
  },

  goToPage(p) {
    const totalPages = Math.ceil(this.filteredRecords.length / this.pageSize) || 1;
    this.currentPage = Math.max(1, Math.min(p, totalPages));
    this.renderTablePage();
    this.renderPagination();
  },

  /**
   * Inicializa listeners de los filtros dentro de la modal
   */
  initModalListeners() {
    const overlay = document.getElementById('drilldownModalOverlay');
    const closeBtn = document.getElementById('btnDrilldownClose');
    const clearBtn = document.getElementById('btnDrilldownClear');

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

    if (clearBtn) {
      clearBtn.onclick = () => {
        if (this.currentContext) {
          this.currentContext.filters = { date: '', weekday: '', city: '', store: '', hour: '', status: '' };
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
