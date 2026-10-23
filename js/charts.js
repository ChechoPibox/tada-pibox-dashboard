// ============================================================
// GRÁFICOS E INSIGHTS ANALÍTICOS (CHART.JS) - TADA / PIBOX
// MÓDULO 3: Métricas y Visualización Enfocadas en la Semana Actual
// v16 – Mejoras: Data Labels inline (cantidades + %) en todos los gráficos de barras
// ============================================================

// ============================================================
// PLUGIN INLINE DE DATA LABELS (sin dependencias externas)
// Dibuja etiquetas de valor encima de cada barra.
// Configuración por dataset via options.dataLabelsCfg:
//   { enabled: bool, showPct: bool, color: str, fontSize: num, formatter: fn }
// ============================================================
const TaDaBarDataLabels = {
  id: 'tadaBarDataLabels',
  afterDatasetsDraw(chart, args, options) {
    if (!options || !options.enabled) return;
    const { ctx, data } = chart;
    const dataset = data.datasets[args.index];
    if (!dataset) return;

    // Solo aplicar en datasets de tipo bar
    const meta = chart.getDatasetMeta(args.index);
    if (!meta || (meta.type !== 'bar')) return;

    const isStacked = chart.options?.scales?.y?.stacked;
    const showPct = options.showPct || false;
    const labelColor = options.color || 'rgba(255,255,255,0.90)';
    const fontSize = options.fontSize || 11;
    const formatter = options.formatter || null;

    ctx.save();
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    meta.data.forEach((bar, idx) => {
      const rawVal = dataset.data[idx];
      if (rawVal == null || rawVal === 0) return;

      let label = '';
      if (formatter) {
        label = formatter(rawVal, idx, dataset, chart);
      } else if (showPct) {
        // Calcular porcentaje sobre la suma de todos los datasets en ese punto
        let total = 0;
        chart.data.datasets.forEach(ds => {
          const v = Number(ds.data[idx] || 0);
          if (!isNaN(v)) total += v;
        });
        const pct = total > 0 ? ((rawVal / total) * 100).toFixed(0) : 0;
        label = `${rawVal} (${pct}%)`;
      } else {
        label = String(rawVal);
      }

      // Posición: si stacked, en el centro del segmento; si normal, encima de la barra
      let y;
      if (isStacked) {
        // Centro vertical del segmento
        const barH = Math.abs(bar.height || 0);
        y = bar.y + barH / 2 + fontSize * 0.35;
        ctx.textBaseline = 'middle';
      } else {
        y = bar.y - 4;
        ctx.textBaseline = 'bottom';
      }

      // Solo dibujar si la barra tiene altura suficiente para mostrar el label
      const minHeight = isStacked ? fontSize + 4 : 0;
      if (isStacked && Math.abs(bar.height || 0) < minHeight) return;

      ctx.fillText(label, bar.x, y);
    });

    ctx.restore();
  }
};

// Registrar el plugin globalmente en Chart.js
if (typeof Chart !== 'undefined') {
  Chart.register(TaDaBarDataLabels);
}

const ChartManager = {
  instances: {},

  colors: {
    violet: '#8b5cf6',
    violetDark: '#5b21b6',
    violetLight: '#a78bfa',
    violetBg: 'rgba(124, 58, 237, 0.22)',
    emerald: '#10b981',
    emeraldBg: 'rgba(16, 185, 129, 0.22)',
    amber: '#f59e0b',
    amberBg: 'rgba(245, 158, 11, 0.22)',
    rose: '#ef4444',
    roseBg: 'rgba(239, 68, 68, 0.22)',
    blue: '#38bdf8',
    cyan: '#06b6d4',
    textMain: '#f0f4ff',
    textMuted: '#8892c0',
    border: 'rgba(139, 92, 246, 0.16)',
    grid: 'rgba(139, 92, 246, 0.07)'
  },

  destroyAll() {
    Object.keys(this.instances).forEach(id => {
      if (this.instances[id]) {
        this.instances[id].destroy();
        delete this.instances[id];
      }
    });
  },

  /**
   * Inicializa los 3 gráficos oficiales del Módulo 3 + Radiografía Diaria
   */
  initCurrentWeekCharts(currentWeekMallaShifts, currentWeekProgShifts) {
    if (typeof Chart === 'undefined') return;

    this.renderTurnComplianceChart('chartTurnCompliance', currentWeekMallaShifts);
    this.renderDemandVsProdWeeklyChart('chartDemandProdWeekly', currentWeekMallaShifts);
    this.renderCoverageByStoreChart('chartCoverageStore', currentWeekMallaShifts);
    this.renderWeeklyDailyBreakdownChart('chartDailyBreakdown', currentWeekMallaShifts);
  },

  // 1. Gráfico de Cumplimiento de Turnos (Semana Actual): Reglas exactas de Tarjetas (Match transversal)
  renderTurnComplianceChart(canvasId, shifts) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    const match = (typeof reconcileShiftsMatch === 'function')
      ? reconcileShiftsMatch(shifts)
      : null;

    if (!match) return;

    const covered = match.totalSlotsCovered;
    const missing = match.totalSlotsMissing;
    const replacements = match.totalReplacements;
    const excluded = match.totalExcluded;

    const total = covered + missing + replacements + excluded;
    const pCovered = total > 0 ? ((covered / total) * 100).toFixed(1) : '0.0';
    const pMissing = total > 0 ? ((missing / total) * 100).toFixed(1) : '0.0';
    const pReplacements = total > 0 ? ((replacements / total) * 100).toFixed(1) : '0.0';
    const pExcluded = total > 0 ? ((excluded / total) * 100).toFixed(1) : '0.0';

    // Tasa operativa de efectividad / asistencia (cubiertos + reemplazos vs cupos evaluables)
    const evaluableSlots = covered + missing + replacements;
    const operationalCompliancePct = evaluableSlots > 0
      ? (((covered + replacements) / evaluableSlots) * 100).toFixed(1)
      : '100.0';

    const centerPlugin = {
      id: 'centerTextTurnCompliance',
      beforeDraw: (chart) => {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = '700 1.6rem Inter, system-ui, sans-serif';
        ctx.fillStyle = this.colors.emerald;
        ctx.fillText(`${operationalCompliancePct}%`, centerX, centerY - 8);

        ctx.font = '500 0.72rem Inter, system-ui, sans-serif';
        ctx.fillStyle = this.colors.textMuted;
        ctx.fillText('Efectividad', centerX, centerY + 14);

        ctx.restore();
      }
    };

    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          `Turnos Cubiertos (${covered} · ${pCovered}%)`,
          `Cupos Faltantes / Cancela sin Reemplazo (${missing} · ${pMissing}%)`,
          `Reemplazos Desplegados (${replacements} · ${pReplacements}%)`,
          `Excluidos (T. Cerrada / Autorizados) (${excluded} · ${pExcluded}%)`
        ],
        datasets: [
          {
            data: [covered, missing, replacements, excluded],
            backgroundColor: [this.colors.emerald, this.colors.rose, this.colors.cyan, '#4b5563'],
            borderWidth: 2,
            borderColor: '#151222'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: this.colors.textMuted,
              boxWidth: 12,
              padding: 14
            }
          },
          tooltip: {
            callbacks: {
              title: (items) => {
                const fullLabel = items[0]?.label || '';
                return fullLabel.split('(')[0].trim();
              },
              label: (item) => {
                const val = item.raw || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                return ` ${val} turnos (${pct}% del total)`;
              }
            }
          }
        },
        cutout: '68%'
      },
      plugins: [centerPlugin]
    });
  },

  // 2. Gráfico de Demanda vs Productividad (Semana Actual)
  renderDemandVsProdWeeklyChart(canvasId, shifts) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    const storeMap = {};
    shifts.forEach(s => {
      if (!s.store || !s.attended) return;
      if (!storeMap[s.store]) storeMap[s.store] = { packages: 0, hours: 0, targets: [] };
      storeMap[s.store].packages += (s.packages || 0);
      storeMap[s.store].hours += (s.hours || 8);
      if (s.target_productivity != null && !isNaN(s.target_productivity)) {
        storeMap[s.store].targets.push(Number(s.target_productivity));
      }
    });

    const stores = Object.keys(storeMap).slice(0, 10);
    const realProd = stores.map(st => +(storeMap[st].packages / (storeMap[st].hours || 8)).toFixed(2));
    const targetProd = stores.map(st => {
      const tg = storeMap[st].targets;
      const avgTg = tg.length > 0 ? (tg.reduce((a, b) => a + b, 0) / tg.length) : 12;
      return +(avgTg / 8).toFixed(2);
    });

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: stores.map(s => s.split('-')[1] || s.substring(0, 15)),
        datasets: [
          {
            label: 'Prod. Entregada (paq/h)',
            data: realProd,
            backgroundColor: this.colors.violet,
            borderRadius: 6
          },
          {
            label: 'Meta Referencia (paq/h)',
            data: targetProd,
            backgroundColor: this.colors.blue,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: this.colors.textMuted, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              title: (items) => stores[items[0].dataIndex],
              label: (item) => {
                const idx = item.dataIndex;
                const st = stores[idx];
                const real = realProd[idx];
                const tg = targetProd[idx];
                const pct = tg > 0 ? ((real / tg) * 100).toFixed(0) : '—';
                const pk = storeMap[st]?.packages || 0;
                const hr = storeMap[st]?.hours || 8;
                if (item.dataset.label.includes('Entregada')) {
                  return ` Prod. Entregada: ${item.raw} paq/h (${pct}% de la meta) · ${pk} paqs en ${hr}h`;
                }
                return ` Meta Referencia: ${item.raw} paq/h`;
              }
            }
          },
          tadaBarDataLabels: {
            enabled: true,
            showPct: false,
            color: 'rgba(255,255,255,0.85)',
            fontSize: 10,
            formatter: (val) => val > 0 ? `${val}` : ''
          }
        },
        scales: {
          x: { grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted, font: { size: 10 } } },
          y: { grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted } }
        }
      }
    });
  },

  // 3. Gráfico de Cobertura y Faltantes por Ciudad/Punto (Semana Actual): Reglas exactas de Tarjetas
  renderCoverageByStoreChart(canvasId, shifts) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    const match = (typeof reconcileShiftsMatch === 'function')
      ? reconcileShiftsMatch(shifts)
      : null;

    if (!match || !match.groups) return;

    const storeMap = {};
    Object.values(match.groups).forEach(g => {
      const storeName = g.store || 'Sin Tienda';
      if (!storeMap[storeName]) {
        storeMap[storeName] = {
          store: storeName,
          covered: 0,
          replacements: 0,
          missing: 0,
          required: 0
        };
      }
      const matched = Math.min(g.cancels, g.reemplazos);
      const unmatched = Math.max(0, g.cancels - g.reemplazos);
      storeMap[storeName].covered += g.activeConfirmed + g.reemplazos;
      storeMap[storeName].missing += unmatched + (g.noProgramado || 0) + (g.sinPiloto || 0);
      storeMap[storeName].replacements += g.reemplazos;
    });

    const allStores = Object.values(storeMap)
      .filter(s => (s.covered + s.missing) > 0)
      .sort((a, b) => (b.covered + b.missing) - (a.covered + a.missing))
      .slice(0, 12);

    const storeLabels = allStores.map(s => s.store.split('-')[1] || s.store.substring(0, 14));
    const coveredData = allStores.map(s => s.covered);
    const missingData = allStores.map(s => s.missing);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: storeLabels,
        datasets: [
          {
            label: 'Turnos Cubiertos',
            data: coveredData,
            backgroundColor: this.colors.emerald,
            borderRadius: 4,
            stack: 'stack'
          },
          {
            label: 'Faltantes / Sin Cubrir',
            data: missingData,
            backgroundColor: this.colors.rose,
            borderRadius: 4,
            stack: 'stack'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: this.colors.textMuted, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              title: (items) => allStores[items[0].dataIndex]?.store || '',
              label: (item) => {
                const idx = item.dataIndex;
                const tot = (coveredData[idx] || 0) + (missingData[idx] || 0);
                const pct = tot > 0 ? ((item.raw / tot) * 100).toFixed(1) : 0;
                return ` ${item.dataset.label}: ${item.raw} turnos (${pct}%)`;
              }
            }
          },
          tadaBarDataLabels: {
            enabled: true,
            showPct: true,
            color: 'rgba(255,255,255,0.92)',
            fontSize: 10
          }
        },
        scales: {
          x: { grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted, font: { size: 10 } } },
          y: { stacked: true, grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted } }
        }
      }
    });
  },

  // ============================================================
  // MEJORA 1: Radiografía Día a Día (Lunes a Domingo) de la semana seleccionada
  // Responde: "¿En qué días específicos se concentraron las cancelaciones/faltantes?"
  // ============================================================
  renderWeeklyDailyBreakdownChart(canvasId, shifts) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    if (!shifts || shifts.length === 0) {
      if (this.instances[canvasId]) { this.instances[canvasId].destroy(); delete this.instances[canvasId]; }
      return;
    }

    // Agrupar por día de la semana (Lunes a Domingo)
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dayMap = {};
    dayOrder.forEach(d => { dayMap[d] = { covered: 0, missing: 0, cancels: 0, replacements: 0, total: 0 }; });

    // Usar reconcileShiftsMatch agrupado por día
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    shifts.forEach(s => {
      let dayName = s.weekday || '';
      // Si no tiene weekday, calcularlo desde la fecha
      if (!dayName && s.date && s.date.length >= 10) {
        const d = new Date(s.date + 'T12:00:00');
        dayName = !isNaN(d.getTime()) ? dayNames[d.getDay()] : '';
      }
      if (!dayName || !dayMap[dayName]) return;

      const st = (s.status || '').toLowerCase().trim();
      const isPilotCancel = st === 'piloto cancela' || st === 'cancela piloto' || st === 'piloto canceló' || st === 'piloto cancelo';
      const isReplacement = st === 'reemplazo';
      const isExcluded = st === 'tienda cerrada' || st === 'cliente cancela' || st === 'adicional autorizado' || st === 'adicional cancela';
      const isAttended = s.attended;

      if (isExcluded) return;
      dayMap[dayName].total++;
      if (isPilotCancel) dayMap[dayName].cancels++;
      if (isReplacement) dayMap[dayName].replacements++;
      if (isAttended) dayMap[dayName].covered++;
    });

    // Calcular faltantes reales (cancelaciones sin reemplazo)
    dayOrder.forEach(d => {
      const day = dayMap[d];
      day.missing = Math.max(0, day.cancels - day.replacements);
    });

    const labels = dayOrder;
    const coveredData = dayOrder.map(d => dayMap[d].covered);
    const cancelsData = dayOrder.map(d => dayMap[d].cancels);
    const missingData = dayOrder.map(d => dayMap[d].missing);
    const replacementsData = dayOrder.map(d => dayMap[d].replacements);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos Asistidos',
            data: coveredData,
            backgroundColor: this.colors.emerald,
            borderRadius: 5,
            stack: 'stack'
          },
          {
            label: 'Reemplazos',
            data: replacementsData,
            backgroundColor: this.colors.cyan,
            borderRadius: 5,
            stack: 'stack'
          },
          {
            label: 'Faltantes (Cancela sin Reemplazo)',
            data: missingData,
            backgroundColor: this.colors.rose,
            borderRadius: 5,
            stack: 'stack'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: this.colors.textMuted, boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              afterBody: (items) => {
                const idx = items[0]?.dataIndex;
                const totalCancels = cancelsData[idx];
                const total = (coveredData[idx] || 0) + (replacementsData[idx] || 0) + (missingData[idx] || 0);
                const lines = [];
                if (totalCancels > 0) lines.push(`── Cancelaciones totales: ${totalCancels}`);
                if (total > 0) {
                  const covPct = ((coveredData[idx] || 0) / total * 100).toFixed(0);
                  lines.push(`── Asistencia: ${covPct}% del día`);
                }
                return lines;
              }
            }
          },
          tadaBarDataLabels: {
            enabled: true,
            showPct: true,
            color: 'rgba(255,255,255,0.90)',
            fontSize: 10
          },
          annotation: undefined
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: this.colors.grid },
            ticks: { color: this.colors.textMuted, font: { size: 12, weight: '600' } }
          },
          y: {
            stacked: true,
            grid: { color: this.colors.grid },
            ticks: { color: this.colors.textMuted, stepSize: 1 },
            beginAtZero: true
          }
        }
      }
    });
  },

  // ============================================================
  // MEJORA 2: Tendencia Histórica con Líneas de Meta SLA
  // Muestra visualmente en qué semanas se estuvo en zona verde/peligro
  // ============================================================
  renderWeeklyTrendChart(canvasId, weeklyData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    const labels = weeklyData.map(w => w.weekLabel);
    const assistData = weeklyData.map(w => +(w.attendancePct || 0).toFixed(1));
    const cancelData = weeklyData.map(w => +(w.cancellationPct || 0).toFixed(1));
    const coverageData = weeklyData.map(w => +(w.cuposCoveragePct || 0).toFixed(1));

    // Líneas de referencia SLA (punteadas horizontales)
    const slaAsistencia = Array(labels.length).fill(90); // Meta mínima de asistencia = 90%
    const slaCancelacion = Array(labels.length).fill(8);  // Límite crítico de cancelación = 8%

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '✅ Efectividad Asistencia (%)',
            data: assistData,
            borderColor: this.colors.emerald,
            backgroundColor: this.colors.emeraldBg,
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: assistData.map(v => v >= 90 ? this.colors.emerald : '#f59e0b'),
            pointBorderColor: assistData.map(v => v >= 90 ? this.colors.emerald : '#f59e0b'),
            fill: false,
            order: 1
          },
          {
            label: '🚨 Tasa Cancelación (%)',
            data: cancelData,
            borderColor: this.colors.rose,
            backgroundColor: this.colors.roseBg,
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: cancelData.map(v => v > 8 ? '#ff0000' : this.colors.rose),
            pointBorderColor: cancelData.map(v => v > 8 ? '#ff0000' : this.colors.rose),
            fill: false,
            order: 2
          },
          {
            label: '🟣 Cobertura de Cupos (%)',
            data: coverageData,
            borderColor: this.colors.violet,
            backgroundColor: this.colors.violetBg,
            borderWidth: 2,
            borderDash: [5, 4],
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: this.colors.violet,
            fill: false,
            order: 3
          },
          {
            label: '— Meta Asistencia SLA (90%)',
            data: slaAsistencia,
            borderColor: 'rgba(16, 185, 129, 0.45)',
            borderWidth: 1.5,
            borderDash: [8, 5],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            order: 4
          },
          {
            label: '— Límite Cancelación SLA (8%)',
            data: slaCancelacion,
            borderColor: 'rgba(239, 68, 68, 0.45)',
            borderWidth: 1.5,
            borderDash: [8, 5],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            order: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: {
              color: this.colors.textMuted,
              boxWidth: 12,
              filter: (item) => !item.text.startsWith('—') // Ocultar leyenda de líneas SLA para no saturar
            }
          },
          tooltip: {
            callbacks: {
              label: (item) => {
                if (item.dataset.label.startsWith('—')) return null;
                const val = item.raw;
                const label = item.dataset.label;
                let badge = '';
                if (label.includes('Asistencia')) badge = val >= 90 ? ' ✅' : ' ⚠️';
                if (label.includes('Cancelación')) badge = val <= 8 ? ' ✅' : ' 🚨';
                return ` ${label}: ${val}%${badge}`;
              },
              afterBody: (items) => {
                const idx = items[0]?.dataIndex;
                const assist = assistData[idx];
                const cancel = cancelData[idx];
                const lines = [];
                if (assist !== undefined) lines.push(assist >= 90 ? '✅ Asistencia en Meta SLA' : '⚠️ Asistencia BAJO Meta (< 90%)');
                if (cancel !== undefined) lines.push(cancel <= 8 ? '✅ Cancelación en rango aceptable' : '🚨 Cancelación SOBRE Límite (> 8%)');
                return lines;
              }
            }
          }
        },
        scales: {
          x: { grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted, font: { size: 10 } } },
          y: {
            min: 0,
            suggestedMax: 105,
            grid: { color: this.colors.grid },
            ticks: {
              color: this.colors.textMuted,
              callback: (v) => `${v}%`
            }
          }
        }
      }
    });
  },

  // 5. Gráfico de Volumen + Productividad Dual Eje (Paquetes como barras, Paq/H como línea)
  renderWeeklyVolumeChart(canvasId, weeklyData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    const labels = weeklyData.map(w => w.weekLabel);
    const packagesData = weeklyData.map(w => w.totalPackages);
    const productivityData = weeklyData.map(w => w.productivity ? +w.productivity.toFixed(2) : null);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Paquetes Entregados',
            data: packagesData,
            backgroundColor: this.colors.violetBg,
            borderColor: this.colors.violet,
            borderWidth: 1.5,
            borderRadius: 6,
            yAxisID: 'yPaq',
            order: 2
          },
          {
            type: 'line',
            label: 'Productividad (paq/h)',
            data: productivityData,
            borderColor: this.colors.amber,
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: this.colors.amber,
            fill: false,
            yAxisID: 'yProd',
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: this.colors.textMuted, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (item) => {
                if (item.dataset.label.includes('Paquetes')) {
                  return ` Paquetes: ${new Intl.NumberFormat('es-CO').format(item.raw)}`;
                }
                return item.raw != null ? ` Prod: ${item.raw} paq/h` : null;
              }
            }
          }
        },
        scales: {
          x: { grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted, font: { size: 10 } } },
          yPaq: {
            type: 'linear',
            position: 'left',
            grid: { color: this.colors.grid },
            ticks: { color: this.colors.textMuted },
            title: { display: true, text: 'Paquetes', color: this.colors.textMuted, font: { size: 10 } }
          },
          yProd: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              color: this.colors.amber,
              callback: (v) => `${v} p/h`
            },
            title: { display: true, text: 'Paq/Hora', color: this.colors.amber, font: { size: 10 } }
          }
        }
      }
    });
  },

  // ============================================================
  // 6. Gráfico de Desempeño Operativo por Ciudad y Tienda (Req 7 & Req 9)
  // ============================================================
  renderCityStorePerformanceChart(canvasId, shifts, selectedCity) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    if (!shifts || shifts.length === 0) {
      delete this.instances[canvasId];
      return;
    }

    let filtered = shifts;
    let isStoreView = false;
    if (selectedCity) {
      filtered = shifts.filter(s => (s.city || '').toLowerCase() === selectedCity.toLowerCase());
      isStoreView = true;
    }

    // Agrupar
    const groupMap = {};
    filtered.forEach(s => {
      const groupKey = isStoreView ? (s.store || 'Sin Tienda') : (s.city || 'Sin Ciudad');
      if (!groupMap[groupKey]) {
        groupMap[groupKey] = {
          label: groupKey,
          totalShifts: 0,
          attended: 0,
          cancels: 0,
          reemplazos: 0,
          packages: 0,
          hours: 0
        };
      }
      const g = groupMap[groupKey];
      const st = (s.status || '').toLowerCase().trim();
      const isPilotCancel = st.includes('piloto') && st.includes('cancel');
      const isExcluded = st === 'tienda cerrada' || st === 'cliente cancela' || st === 'adicional no autorizado' || st === 'adicional autorizado' || st === 'adicional cancela';

      if (!isExcluded) {
        g.totalShifts++;
        if (s.attended) g.attended++;
        if (isPilotCancel) g.cancels++;
        if (st === 'reemplazo') g.reemplazos++;
      }
      if (s.attended) {
        g.packages += (s.packages || 0);
        g.hours += (s.hours || 8);
      }
    });

    const entries = Object.values(groupMap)
      .filter(g => g.totalShifts > 0)
      .sort((a, b) => b.totalShifts - a.totalShifts)
      .slice(0, 10);

    if (entries.length === 0) {
      delete this.instances[canvasId];
      return;
    }

    const labels = entries.map(e => isStoreView ? (e.label.split('-')[1] || e.label.substring(0, 14)) : e.label);
    const fullNames = entries.map(e => e.label);
    const coveragePcts = entries.map(e => +(Math.min(100, (e.attended / e.totalShifts) * 100)).toFixed(1));
    const cancelPcts = entries.map(e => +((e.cancels / e.totalShifts) * 100).toFixed(1));
    const productivityData = entries.map(e => e.hours > 0 ? +(e.packages / e.hours).toFixed(2) : 0);
    const totalsData = entries.map(e => e.totalShifts);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Cobertura Asistencia (%)',
            data: coveragePcts,
            backgroundColor: this.colors.emerald,
            borderRadius: 5,
            yAxisID: 'yPct',
            order: 2
          },
          {
            type: 'bar',
            label: 'Tasa Cancelación (%)',
            data: cancelPcts,
            backgroundColor: this.colors.rose,
            borderRadius: 5,
            yAxisID: 'yPct',
            order: 3
          },
          {
            type: 'line',
            label: 'Productividad (paq/h)',
            data: productivityData,
            borderColor: this.colors.amber,
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: this.colors.amber,
            tension: 0.2,
            yAxisID: 'yProd',
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: this.colors.textMuted, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              title: (items) => fullNames[items[0].dataIndex],
              label: (item) => {
                const idx = item.dataIndex;
                const total = totalsData[idx];
                if (item.dataset.label.includes('Cobertura')) {
                  return ` Cobertura: ${item.raw}% (${entries[idx].attended}/${total} turnos)`;
                }
                if (item.dataset.label.includes('Cancelación')) {
                  return ` Cancelaciones: ${item.raw}% (${entries[idx].cancels}/${total} turnos)`;
                }
                return ` Prod: ${item.raw} paq/h (${entries[idx].packages} paqs)`;
              }
            }
          },
          tadaBarDataLabels: {
            enabled: true,
            showPct: false,
            color: 'rgba(255,255,255,0.88)',
            fontSize: 10,
            formatter: (val, idx, dataset) => {
              // Solo mostrar label en barras de porcentaje, no en línea de productividad
              if (dataset.type === 'line') return '';
              return val > 0 ? `${val}%` : '';
            }
          }
        },
        scales: {
          x: { grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted, font: { size: 10 } } },
          yPct: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            grid: { color: this.colors.grid },
            ticks: {
              color: this.colors.textMuted,
              callback: (v) => `${v}%`
            },
            title: { display: true, text: 'Porcentaje (%)', color: this.colors.textMuted, font: { size: 10 } }
          },
          yProd: {
            type: 'linear',
            position: 'right',
            min: 0,
            grid: { drawOnChartArea: false },
            ticks: {
              color: this.colors.amber,
              callback: (v) => `${v} p/h`
            },
            title: { display: true, text: 'Paq/Hora', color: this.colors.amber, font: { size: 10 } }
          }
        }
      }
    });
  },

  // ============================================================
  // 7. Gráfico Comparativo: Mes Actual vs. Mes Anterior (Corte equivalente mismo día) (Req 8 & Req 9)
  // ============================================================
  renderMonthVsPreviousMonthChart(canvasId, mallaShifts) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    if (!mallaShifts || mallaShifts.length === 0) {
      delete this.instances[canvasId];
      return;
    }

    // Encontrar la fecha más reciente en el dataset
    let maxDateStr = '';
    mallaShifts.forEach(s => {
      if (s.date && s.date > maxDateStr) maxDateStr = s.date;
    });

    if (!maxDateStr) {
      delete this.instances[canvasId];
      return;
    }

    const [currY, currM, currD] = maxDateStr.split('-').map(Number);
    const dayCutoff = currD;

    const prevY = currM === 1 ? currY - 1 : currY;
    const prevM = currM === 1 ? 12 : currM - 1;

    const monthNames = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currMonthLabel = `${monthNames[currM]} ${currY}`;
    const prevMonthLabel = `${monthNames[prevM]} ${prevY}`;

    // Filtrar turnos de ambos periodos respetando exactamente los días 1 al dayCutoff
    const currShifts = [];
    const prevShifts = [];

    mallaShifts.forEach(s => {
      if (!s.date || s.date.length < 10) return;
      const [y, m, d] = s.date.split('-').map(Number);
      if (d < 1 || d > dayCutoff) return;

      if (y === currY && m === currM) currShifts.push(s);
      else if (y === prevY && m === prevM) prevShifts.push(s);
    });

    // Actualizar badges en index.html
    const subEl = document.getElementById('monthVsMonthSubtitle');
    const badgeEl = document.getElementById('monthVsMonthBadge');
    if (subEl) {
      subEl.innerText = `Corte cronológico equivalente: Días 1 al ${dayCutoff} (${currMonthLabel} vs. ${prevMonthLabel})`;
    }
    if (badgeEl) {
      badgeEl.innerText = `Día 1–${dayCutoff} · ${currShifts.length} vs ${prevShifts.length} turnos`;
    }

    const calcPeriodMetrics = (shifts) => {
      let evaluable = 0;
      let attended = 0;
      let cancels = 0;
      let packages = 0;
      let hours = 0;

      shifts.forEach(s => {
        const cls = typeof classifyShiftStatus === 'function' ? classifyShiftStatus(s.status) : null;
        const isEval = cls ? cls.evaluable : (s.evaluable !== undefined ? Boolean(s.evaluable) : !s.excluded);
        const isAtt = cls ? cls.attended : Boolean(s.attended);
        const isCanc = cls ? cls.pilotCancel : Boolean(s.pilot_cancel);

        if (isEval) {
          evaluable++;
          if (isAtt) attended++;
          if (isCanc) cancels++;
        }
        if (isAtt) {
          packages += (s.packages || 0);
          hours += (s.hours || 8);
        }
      });

      const missing = Math.max(0, evaluable - attended);
      const covPct = evaluable > 0 ? (attended / evaluable) * 100 : null;
      const canPct = evaluable > 0 ? (cancels / evaluable) * 100 : null;
      const prod = hours > 0 ? (packages / hours) : null;

      return { evaluable, attended, missing, cancels, covPct, canPct, prod, packages };
    };

    const currMet = calcPeriodMetrics(currShifts);
    const prevMet = calcPeriodMetrics(prevShifts);

    const categories = [
      'Turnos Prog.',
      'Turnos Cubiertos',
      'Faltantes',
      'Cancelaciones',
      'Cobertura (%)',
      'Prod. (paq/h)'
    ];

    const currValues = [
      currMet.evaluable,
      currMet.attended,
      currMet.missing,
      currMet.cancels,
      currMet.covPct != null ? +currMet.covPct.toFixed(1) : null,
      currMet.prod != null ? +currMet.prod.toFixed(2) : null
    ];

    const prevValues = [
      prevMet.evaluable,
      prevMet.attended,
      prevMet.missing,
      prevMet.cancels,
      prevMet.covPct != null ? +prevMet.covPct.toFixed(1) : null,
      prevMet.prod != null ? +prevMet.prod.toFixed(2) : null
    ];

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          {
            label: `${currMonthLabel} (Día 1–${dayCutoff})`,
            data: currValues,
            backgroundColor: this.colors.violet,
            borderRadius: 5
          },
          {
            label: `${prevMonthLabel} (Día 1–${dayCutoff})`,
            data: prevValues,
            backgroundColor: 'rgba(148, 163, 184, 0.55)',
            borderRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: this.colors.textMuted, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              label: (item) => {
                const isPct = item.label.includes('(%)');
                const isProd = item.label.includes('(paq/h)');
                const val = item.raw;
                if (val == null) return ` ${item.dataset.label}: N/A (sin datos)`;
                if (isPct) return ` ${item.dataset.label}: ${val}%`;
                if (isProd) return ` ${item.dataset.label}: ${val} paq/h`;
                return ` ${item.dataset.label}: ${val} turnos`;
              },
              afterBody: (items) => {
                if (items.length >= 2) {
                  const valCurr = items[0].raw;
                  const valPrev = items[1].raw;
                  if (valCurr != null && valPrev != null) {
                    const diff = +(valCurr - valPrev).toFixed(2);
                    const diffPct = valPrev !== 0 ? +((diff / valPrev) * 100).toFixed(1) : null;
                    const sign = diff > 0 ? '+' : '';
                    return [
                      `── Variación: ${sign}${diff}${diffPct != null ? ` (${sign}${diffPct}%)` : ''}`
                    ];
                  }
                }
                return [];
              }
            }
          }
        },
        scales: {
          x: { grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted, font: { size: 10 } } },
          y: { grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted } }
        }
      }
    });
  }
};

