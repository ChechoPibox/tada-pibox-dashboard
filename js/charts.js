// ============================================================
// GRÁFICOS E INSIGHTS ANALÍTICOS (CHART.JS) - TADA / PIBOX
// MÓDULO 3: Métricas y Visualización Enfocadas en la Semana Actual
// ============================================================

const ChartManager = {
  instances: {},

  colors: {
    violet: '#8b5cf6',
    violetDark: '#6d28d9',
    violetLight: '#a78bfa',
    violetBg: 'rgba(139, 92, 246, 0.25)',
    emerald: '#10b981',
    emeraldBg: 'rgba(16, 185, 129, 0.25)',
    amber: '#f59e0b',
    amberBg: 'rgba(245, 158, 11, 0.25)',
    rose: '#ef4444',
    roseBg: 'rgba(239, 68, 68, 0.25)',
    blue: '#3b82f6',
    cyan: '#06b6d4',
    textMain: '#f3f4f6',
    textMuted: '#9ca3af',
    border: 'rgba(255, 255, 255, 0.1)',
    grid: 'rgba(255, 255, 255, 0.06)'
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
   * Inicializa los 3 gráficos oficiales del Módulo 3 enfocados en la semana en curso
   */
  initCurrentWeekCharts(currentWeekMallaShifts, currentWeekProgShifts) {
    if (typeof Chart === 'undefined') return;

    this.renderTurnComplianceChart('chartTurnCompliance', currentWeekMallaShifts);
    this.renderDemandVsProdWeeklyChart('chartDemandProdWeekly', currentWeekMallaShifts);
    this.renderCoverageByStoreChart('chartCoverageStore', currentWeekMallaShifts);
  },

  // 1. Gráfico de Cumplimiento de Turnos (Semana Actual): Reglas exactas de Tarjetas (Match transversal)
  renderTurnComplianceChart(canvasId, shifts) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    const match = (typeof MatchEngine !== 'undefined' && MatchEngine.calculateTurnoMatch)
      ? MatchEngine.calculateTurnoMatch(shifts)
      : null;

    if (!match) return;

    const covered = match.totalSlotsCovered;
    const missing = match.totalSlotsMissing;
    const replacements = match.totalReplacements;
    const excluded = match.totalExcluded;

    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          `Turnos Cubiertos (${covered})`,
          `Cupos Faltantes / Cancela sin Reemplazo (${missing})`,
          `Reemplazos Desplegados (${replacements})`,
          `Excluidos (T. Cerrada / Autorizados) (${excluded})`
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
          legend: { position: 'bottom', labels: { color: this.colors.textMuted, boxWidth: 12, padding: 14 } },
          tooltip: {
            callbacks: {
              label: (item) => ` ${item.label}: ${item.raw} turnos`
            }
          }
        },
        cutout: '68%'
      }
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
      if (!storeMap[s.store]) storeMap[s.store] = { packages: 0, hours: 0, target: s.target_productivity || 12 };
      storeMap[s.store].packages += (s.packages || 0);
      storeMap[s.store].hours += (s.hours || 8);
    });

    const stores = Object.keys(storeMap).slice(0, 10);
    const realProd = stores.map(st => +(storeMap[st].packages / (storeMap[st].hours || 8)).toFixed(2));
    const targetProd = stores.map(st => +(storeMap[st].target / 8).toFixed(2));

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
              label: (item) => ` ${item.dataset.label}: ${item.raw} paq/h`
            }
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

    const match = (typeof MatchEngine !== 'undefined' && MatchEngine.calculateTurnoMatch)
      ? MatchEngine.calculateTurnoMatch(shifts)
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
      const groupCovered = g.activeConfirmed + g.reemplazos;
      const groupMissing = unmatched + g.noProgramado + g.sinPiloto;
      const groupRequired = groupCovered + groupMissing;

      storeMap[storeName].covered += groupCovered;
      storeMap[storeName].replacements += g.reemplazos;
      storeMap[storeName].missing += groupMissing;
      storeMap[storeName].required += groupRequired;
    });

    const topStores = Object.values(storeMap)
      .sort((a, b) => b.required - a.required)
      .slice(0, 10);

    const labels = topStores.map(s => s.store.split('-')[1] || s.store.substring(0, 14));
    const coveredData = topStores.map(s => s.covered);
    const missingData = topStores.map(s => s.missing);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos Cubiertos (Prog + Reemplazos)',
            data: coveredData,
            backgroundColor: this.colors.emerald,
            stack: 'coverage',
            borderRadius: 4
          },
          {
            label: 'Cupos Faltantes (Sin Reemplazo)',
            data: missingData,
            backgroundColor: this.colors.rose,
            stack: 'coverage',
            borderRadius: 4
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
              title: (items) => topStores[items[0].dataIndex].store,
              label: (item) => ` ${item.dataset.label}: ${item.raw} turnos`,
              afterBody: (items) => {
                const s = topStores[items[0].dataIndex];
                const covPct = s.required > 0 ? ((s.covered / s.required) * 100).toFixed(1) : '100.0';
                return [
                  `Demanda base (req): ${s.required}`,
                  `Reemplazos: ${s.replacements}`,
                  `Cobertura: ${covPct}%`
                ];
              }
            }
          }
        },
        scales: {
          x: { grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted, font: { size: 10 } } },
          y: { stacked: true, grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted } }
        }
      }
    });
  },

  // 4. Gráfico de Tendencia Histórica: Asistencia vs Cancelación vs Cobertura Semana a Semana
  renderWeeklyTrendChart(canvasId, weeklyData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    const labels = weeklyData.map(w => w.weekLabel);
    const assistData = weeklyData.map(w => +(w.attendancePct || 0).toFixed(1));
    const cancelData = weeklyData.map(w => +(w.cancellationPct || 0).toFixed(1));
    const coverageData = weeklyData.map(w => +(w.cuposCoveragePct || 0).toFixed(1));

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Efectividad Asistencia (%)',
            data: assistData,
            borderColor: this.colors.emerald,
            backgroundColor: this.colors.emeraldBg,
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: this.colors.emerald,
            fill: false
          },
          {
            label: 'Tasa Cancelación (%)',
            data: cancelData,
            borderColor: this.colors.rose,
            backgroundColor: this.colors.roseBg,
            borderWidth: 2.5,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: this.colors.rose,
            fill: false
          },
          {
            label: 'Cobertura de Cupos (%)',
            data: coverageData,
            borderColor: this.colors.violet,
            backgroundColor: this.colors.violetBg,
            borderWidth: 2.5,
            borderDash: [5, 4],
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: this.colors.violet,
            fill: false
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
              label: (item) => ` ${item.dataset.label}: ${item.raw}%`
            }
          }
        },
        scales: {
          x: { grid: { color: this.colors.grid }, ticks: { color: this.colors.textMuted, font: { size: 10 } } },
          y: {
            min: 0,
            suggestedMax: 100,
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

  // 5. Gráfico de Volumen Histórico de Paquetes Semana a Semana
  renderWeeklyVolumeChart(canvasId, weeklyData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.instances[canvasId]) this.instances[canvasId].destroy();

    const labels = weeklyData.map(w => w.weekLabel);
    const packagesData = weeklyData.map(w => w.totalPackages);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Paquetes Entregados',
            data: packagesData,
            backgroundColor: this.colors.violet,
            hoverBackgroundColor: this.colors.violetLight,
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
              label: (item) => ` Paquetes: ${new Intl.NumberFormat('es-CO').format(item.raw)}`
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
