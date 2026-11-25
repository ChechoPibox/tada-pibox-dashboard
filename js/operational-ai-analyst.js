// ============================================================
// ANALISTA OPERATIVO IA — TADA / PIBOX (FASE 2+)
// Capa de IA desacoplada y contextual: interpreta métricas
// usando KPI_DICTIONARY, detecta anomalías con DataQualityAuditor,
// responde preguntas multi-intención y distingue hechos vs hipótesis.
// ============================================================

const OperationalAIAnalyst = {
  // Decisiones operativas guardadas en localStorage
  DECISIONS_KEY: 'pibox_operational_decisions_v1',

  getSavedDecisions() {
    try {
      const raw = localStorage.getItem(this.DECISIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) {
      return [];
    }
  },

  saveDecision(decision) {
    const list = this.getSavedDecisions();
    const newEntry = {
      id: 'DEC-' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'Pendiente', // Pendiente, En gestión, Implementada, Resuelta
      ...decision
    };
    list.unshift(newEntry);
    try {
      localStorage.setItem(this.DECISIONS_KEY, JSON.stringify(list));
    } catch(e) {}
    return newEntry;
  },

  updateDecisionStatus(id, newStatus, outcomeNote = '') {
    const list = this.getSavedDecisions();
    const item = list.find(d => d.id === id);
    if (item) {
      item.status = newStatus;
      item.updatedAt = new Date().toISOString();
      if (outcomeNote) item.outcomeNote = outcomeNote;
      try {
        localStorage.setItem(this.DECISIONS_KEY, JSON.stringify(list));
      } catch(e) {}
    }
    return list;
  },

  /**
   * Extrae contexto del periodo activo a partir de los turnos filtrados
   */
  getPeriodContext(filteredMalla) {
    if (!filteredMalla || filteredMalla.length === 0) {
      return { minDate: null, maxDate: null, citiesCount: 0, storesCount: 0, totalShifts: 0 };
    }
    let minDate = null;
    let maxDate = null;
    const cities = new Set();
    const stores = new Set();

    filteredMalla.forEach(s => {
      if (s.date) {
        if (!minDate || s.date < minDate) minDate = s.date;
        if (!maxDate || s.date > maxDate) maxDate = s.date;
      }
      if (s.city) cities.add(s.city);
      if (s.store) stores.add(s.store);
    });

    return {
      minDate,
      maxDate,
      citiesCount: cities.size,
      storesCount: stores.size,
      totalShifts: filteredMalla.length
    };
  },

  /**
   * Genera el Resumen Inteligente del Periodo basado en el contexto filtrado
   */
  generateExecutiveSummary(filteredMalla, kpis, rulesEval) {
    if (!filteredMalla || filteredMalla.length === 0 || !kpis) {
      return {
        healthScore: 0,
        statusLabel: 'Sin Datos',
        statusColor: '#9ca3af',
        summaryText: 'No hay registros disponibles para el periodo o filtros seleccionados.',
        topHighlights: [],
        primaryRisks: [],
        dataQuality: null,
        periodContext: null
      };
    }

    // Índice de Salud Operativa Transparente (0 - 100)
    // 40% Cobertura de Cupos (target 95% = 100 pts)  → kpis.cuposCoveragePct
    // 30% Tasa de No-Cancelación (100 - cancelRate)  → kpis.cancellationRatePct
    // 30% Productividad (target 1.20 paq/h = 100 pts) → kpis.fleetProductivityPaqH
    const covPct    = typeof kpis.cuposCoveragePct === 'number'       ? kpis.cuposCoveragePct       : (kpis.coberturaAsistenciaPct || 0);
    const cancelPct = typeof kpis.cancellationRatePct === 'number'    ? kpis.cancellationRatePct    : (kpis.tasaCancelacionPct || 0);
    const prodPqH   = typeof kpis.fleetProductivityPaqH === 'number'  ? kpis.fleetProductivityPaqH  : (kpis.productividadReal || 0);

    const covScore    = Math.min(100, Math.max(0, (covPct / 95) * 100));
    const cancelScore = Math.max(0, 100 - (cancelPct * 2.5));
    const prodScore   = Math.min(100, Math.max(0, (prodPqH / 1.20) * 100));

    const healthScore = Math.round((covScore * 0.40) + (cancelScore * 0.30) + (prodScore * 0.30));

    let statusLabel = 'Saludable';
    let statusColor = '#10b981';
    if (healthScore < 70) {
      statusLabel = 'En Riesgo Crítico';
      statusColor = '#ef4444';
    } else if (healthScore < 85) {
      statusLabel = 'Alerta Operativa';
      statusColor = '#f59e0b';
    }

    // Ciudades destacadas y que requieren atención
    const cities = Object.values((rulesEval && rulesEval.cityStats) || {});
    cities.forEach(c => {
      c.prod = c.hours > 0 ? (c.packages / c.hours) : 0;
      const evalDenom = (c.attendedShifts || 0) + (c.pilotCancels || 0);
      c.cancelRate = evalDenom > 0 ? ((c.pilotCancels || 0) / evalDenom) * 100 : 0;
    });
    cities.sort((a, b) => b.prod - a.prod);

    const bestCity = cities.length > 0 ? cities[0] : null;
    const worstCity = cities.length > 1 ? cities[cities.length - 1] : null;

    // Tiendas con más vacantes
    const stores = Object.values((rulesEval && rulesEval.storeStats) || {});
    stores.sort((a, b) => b.unmatchedCancels - a.unmatchedCancels);
    const topMissingStores = stores.filter(s => s.unmatchedCancels > 0);

    const _covPct    = typeof kpis.cuposCoveragePct === 'number'      ? kpis.cuposCoveragePct      : (kpis.coberturaAsistenciaPct || 0);
    const _prodPqH   = typeof kpis.fleetProductivityPaqH === 'number' ? kpis.fleetProductivityPaqH : (kpis.productividadReal || 0);
    const _totalPkgs = typeof kpis.totalPackages === 'number'         ? kpis.totalPackages         : (kpis.totalPaquetes || 0);

    const periodCtx = this.getPeriodContext(filteredMalla);
    const periodLabel = periodCtx.minDate && periodCtx.maxDate
      ? (periodCtx.minDate === periodCtx.maxDate ? `el ${periodCtx.minDate}` : `del ${periodCtx.minDate} al ${periodCtx.maxDate}`)
      : 'el periodo filtrado';

    // Auditoría de calidad de datos (no intrusiva)
    const dataQuality = typeof DataQualityAuditor !== 'undefined'
      ? DataQualityAuditor.auditShifts(filteredMalla)
      : null;

    const dqNote = (dataQuality && dataQuality.totalIssues > 0)
      ? ` Se detectaron **${dataQuality.totalIssues} alertas de calidad de datos** en la muestra.`
      : '';

    const summaryText = `Para ${periodLabel} (${periodCtx.totalShifts.toLocaleString()} turnos en ${periodCtx.citiesCount} ciudades), la operación registra una salud de **${healthScore}/100** (${statusLabel}), con cobertura de cupos del **${_covPct.toFixed(1)}%**, tasa de cancelación de piloto del **${cancelPct.toFixed(1)}%** y productividad global de **${_prodPqH.toFixed(2)} paq/h** (${_totalPkgs.toLocaleString()} paquetes). Se identificaron **${kpis.cuposFaltantesTotal} vacantes totales** (${kpis.cuposFaltantesBreakdown.unmatchedCancels} cancelados sin reemplazo), concentradas principalmente en ${topMissingStores.length > 0 ? topMissingStores.slice(0, 2).map(s => s.store.split(' - ')[0]).join(' y ') : 'ninguna tienda crítica'}.${dqNote}`;

    return {
      healthScore,
      healthComponents: {
        cobertura: Math.round(covScore),
        cancelaciones: Math.round(cancelScore),
        productividad: Math.round(prodScore)
      },
      statusLabel,
      statusColor,
      summaryText,
      bestCity,
      worstCity,
      topMissingStores: topMissingStores.slice(0, 3),
      criticalAlertsCount: (rulesEval && rulesEval.criticalCount) || 0,
      dataQuality,
      periodContext: periodCtx
    };
  },

  /**
   * Responde preguntas contextuales del usuario con evidencia matemática estricta
   * y separación clara entre Hechos Verificados e Hipótesis / Recomendación.
   */
  answerQuery(query, filteredMalla, kpis, rulesEval) {
    const q = (query || '').toLowerCase().trim();
    if (!filteredMalla || filteredMalla.length === 0) {
      return {
        answer: '⚠️ No hay datos cargados para los filtros seleccionados actualmente. Por favor ajusta o restablece los filtros.',
        evidence: []
      };
    }

    const stores = Object.values((rulesEval && rulesEval.storeStats) || {});
    const cities = Object.values((rulesEval && rulesEval.cityStats) || {});
    const pilots = Object.values((rulesEval && rulesEval.pilotStats) || {});
    const periodCtx = this.getPeriodContext(filteredMalla);
    const periodSpan = periodCtx.minDate && periodCtx.maxDate ? `${periodCtx.minDate} → ${periodCtx.maxDate}` : 'Periodo activo';

    // 1. Auditoría de Calidad de Datos / Duplicados / Inconsistencias
    if (q.includes('calidad') || q.includes('duplicad') || q.includes('inconsisten') || q.includes('auditor') || q.includes('anomal')) {
      if (typeof DataQualityAuditor === 'undefined') {
        return { answer: 'ℹ️ El módulo DataQualityAuditor no está cargado en este entorno.', evidence: [] };
      }
      const dq = DataQualityAuditor.auditShifts(filteredMalla);
      if (dq.totalIssues === 0) {
        return {
          answer: `✅ **Hecho Verificado (${periodSpan}):** Se auditaron **${dq.auditedCount.toLocaleString()} turnos** y no se detectaron errores, duplicados ni anomalías de calidad.`,
          evidence: [{ item: 'Turnos auditados', value: dq.auditedCount }, { item: 'Hallazgos', value: 0 }]
        };
      }
      const list = dq.findings.map(f => `• **[${f.severity}] ${f.title}:** ${f.description}`).join('\n');
      return {
        answer: `🛡️ **Auditoría de Calidad de Datos (${periodSpan}):**\n\n**Hechos verificados sobre ${dq.auditedCount.toLocaleString()} registros:**\n${list}\n\n💡 **Recomendación:** Corregir duplicados y registros cancelados con paquetes directamente en el Google Sheet origen para mantener la integridad analítica.`,
        evidence: dq.findings.map(f => ({ item: f.title, value: `${f.count} (${f.severity})` }))
      };
    }

    // 2. Definición / Fórmula de KPIs (conectado a KPI_DICTIONARY)
    if (q.includes('formula') || q.includes('fórmula') || q.includes('definicion') || q.includes('definición') || q.includes('como se calcula') || q.includes('cómo se calcula') || q.includes('kpi') || q.includes('diferencia')) {
      if (typeof KPI_DICTIONARY !== 'undefined') {
        const allKpis = KPI_DICTIONARY.getAll();
        const matched = allKpis.find(k =>
          q.includes(k.id.toLowerCase()) ||
          q.includes(k.name.toLowerCase()) ||
          (k.id === 'cancelacion' && q.includes('cancel')) ||
          (k.id === 'cuposFaltantes' && q.includes('vacante')) ||
          (k.id === 'productividad' && q.includes('productiv')) ||
          (k.id === 'puntualidad' && q.includes('puntual'))
        );
        if (matched) {
          const extra = matched.id === 'cobertura' ? `\n\n📌 **Nota Mod. 1 vs Mod. 3:** ${KPI_DICTIONARY.explainCoverageDifference()}` : '';
          return {
            answer: `📘 **Diccionario Oficial — ${matched.name} (${matched.module}):**\n\n• **Fórmula:** \`${matched.formula}\`\n• **Meta:** ${matched.target}\n• **Incluye:** ${matched.inclusions.join(', ')}\n• **Excluye:** ${matched.exclusions.join(', ')}\n• **Interpretación:** ${matched.interpretation}${extra}`,
            evidence: [{ item: 'Fuente', value: matched.source }, { item: 'Meta', value: matched.target }]
          };
        }
        return {
          answer: `📘 **Diccionario de KPIs Disponibles (${allKpis.length} indicadores):**\n\n${allKpis.map(k => `• **${k.name}:** \`${k.formula}\` (Meta: ${k.target})`).join('\n')}\n\n📌 **Aclaración Cobertura:** ${KPI_DICTIONARY.explainCoverageDifference()}`,
          evidence: allKpis.slice(0, 5).map(k => ({ item: k.name, value: k.target }))
        };
      }
    }

    // 3. Reemplazos y Cobertura
    if (q.includes('reemplazo') || q.includes('cobertura')) {
      const totalCanc = kpis.cuposFaltantesBreakdown?.rawCancels || 0;
      const matchedRep = kpis.cuposFaltantesBreakdown?.matchedReplacements || 0;
      const unmatched = kpis.cuposFaltantesBreakdown?.unmatchedCancels || 0;
      const repRate = totalCanc > 0 ? (matchedRep / totalCanc) * 100 : 100;
      const covNote = typeof KPI_DICTIONARY !== 'undefined' ? `\n\n📌 **Contexto:** ${KPI_DICTIONARY.explainCoverageDifference()}` : '';

      return {
        answer: `🛡️ **Análisis de Cobertura y Reemplazos (${periodSpan}):**\n\n**Hechos Verificados:**\n• **Cobertura de Cupos (Mód. 1):** **${(kpis.cuposCoveragePct || 0).toFixed(1)}%**\n• **Efectividad de Asistencia:** **${(kpis.asistenciaEffectivenessPct || 0).toFixed(1)}%**\n• **Cancelaciones brutas:** ${totalCanc} · **Cubiertas con reemplazo:** ${matchedRep} (**${repRate.toFixed(1)}%** de recuperación) · **Sin reemplazo:** ${unmatched}.${covNote}\n\n💡 **Hipótesis / Recomendación:** Reforzar la bolsa de suplentes en las franjas donde quedan ${unmatched} vacantes sin cubrir.`,
        evidence: [
          { item: 'Cobertura Mód. 1', value: `${(kpis.cuposCoveragePct || 0).toFixed(1)}%` },
          { item: 'Reemplazos emparejados', value: matchedRep },
          { item: 'Sin reemplazo', value: unmatched }
        ]
      };
    }

    // 4. Turnos Adicionales (Autorizados, TaDa, No autorizados, Cancelados)
    if (q.includes('adicional')) {
      const bd = kpis.cuposBreakdown || {};
      return {
        answer: `➕ **Desglose de Turnos Adicionales (${periodSpan}):**\n\n**Hechos Verificados:**\n• **Adicional TaDa:** ${bd.adicionalTaDa || 0} turnos\n• **Adicional Autorizado:** ${bd.adicionalAutorizados || 0} turnos\n• **Adicional Cancela/Cancelado (excluido de tasa):** ${bd.adicionalCancela || 0} turnos\n• **Adicional No Autorizado (excluido de cobertura):** ${bd.adicionalNoAutorizado || 0} turnos\n\n💡 **Recomendación:** Auditar los **${bd.adicionalNoAutorizado || 0}** turnos adicionales no autorizados para validar si responden a picos reales de demanda no programados.`,
        evidence: [
          { item: 'Adicional TaDa', value: bd.adicionalTaDa || 0 },
          { item: 'Adicional Autorizado', value: bd.adicionalAutorizados || 0 },
          { item: 'No Autorizado', value: bd.adicionalNoAutorizado || 0 }
        ]
      };
    }

    // 5. Puntualidad y Gabela
    if (q.includes('puntual') || q.includes('gabela') || q.includes('tarde') || q.includes('llegada')) {
      const pct = kpis.punctualityPct != null ? `${kpis.punctualityPct.toFixed(1)}%` : 'N/D';
      return {
        answer: `⏱️ **Análisis de Puntualidad (${periodSpan}):**\n\n**Hechos Verificados:**\n• **Puntualidad global con gabela:** **${pct}** (Meta: ≥ 90%)\n• **Turnos puntuales:** ${kpis.punctualCount || 0} de ${kpis.punctualityEvaluatedCount || 0} turnos con hora de inicio y llegada registradas.\n\n💡 **Hipótesis / Recomendación:** Si la puntualidad baja del 90%, revisar concentraciones en franjas de apertura matutina y tiempos de desplazamiento en tienda.`,
        evidence: [
          { item: 'Puntualidad', value: pct },
          { item: 'Puntuales', value: kpis.punctualCount || 0 },
          { item: 'Evaluados', value: kpis.punctualityEvaluatedCount || 0 }
        ]
      };
    }

    // 6. Consulta por Ciudad o Tienda específica mencionada en la pregunta
    const matchedCity = cities.find(c => c.city && q.includes(c.city.toLowerCase()));
    if (matchedCity) {
      const prod = matchedCity.hours > 0 ? (matchedCity.packages / matchedCity.hours) : 0;
      const evalDenom = (matchedCity.attendedShifts || 0) + (matchedCity.pilotCancels || 0);
      const canRate = evalDenom > 0 ? ((matchedCity.pilotCancels || 0) / evalDenom) * 100 : 0;
      return {
        answer: `🏙️ **Diagnóstico de Ciudad — ${matchedCity.city} (${periodSpan}):**\n\n**Hechos Verificados:**\n• **Turnos filtrados:** ${matchedCity.shifts.length} (${matchedCity.attendedShifts || 0} asistidos)\n• **Productividad:** **${prod.toFixed(2)} paq/h** (${matchedCity.packages.toLocaleString()} paquetes en ${matchedCity.hours.toFixed(1)}h)\n• **Cancelación de piloto:** **${canRate.toFixed(1)}%** (${matchedCity.pilotCancels || 0} piloto, ${matchedCity.clientCancels || 0} cliente)\n• **Reemplazos:** ${matchedCity.replacements} · **Vacantes sin cubrir:** ${matchedCity.unmatchedCancels || 0}`,
        evidence: [
          { item: 'Productividad', value: `${prod.toFixed(2)} paq/h` },
          { item: 'Cancelación', value: `${canRate.toFixed(1)}%` },
          { item: 'Vacantes', value: matchedCity.unmatchedCancels || 0 }
        ]
      };
    }

    const matchedStore = stores.find(s => s.store && (q.includes(s.store.toLowerCase()) || q.includes(s.store.split(' - ')[0].toLowerCase())));
    if (matchedStore) {
      return {
        answer: `🏪 **Diagnóstico de Tienda — ${matchedStore.store} (${matchedStore.city}):**\n\n**Hechos Verificados:**\n• **Turnos:** ${matchedStore.shifts.length} (${matchedStore.attendedShifts || 0} asistidos)\n• **Cobertura:** **${matchedStore.coveragePct.toFixed(1)}%** (${matchedStore.covered}/${matchedStore.scheduled})\n• **Productividad:** **${matchedStore.productivity.toFixed(2)} paq/h** (${matchedStore.packages.toLocaleString()} paq / ${matchedStore.hours.toFixed(1)}h)\n• **Cancelaciones:** ${matchedStore.cancels} · **Reemplazos:** ${matchedStore.replacements} · **Sin reemplazo:** ${matchedStore.unmatchedCancels}`,
        evidence: [
          { item: 'Cobertura', value: `${matchedStore.coveragePct.toFixed(1)}%` },
          { item: 'Productividad', value: `${matchedStore.productivity.toFixed(2)} paq/h` },
          { item: 'Sin reemplazo', value: matchedStore.unmatchedCancels }
        ]
      };
    }

    // 7. ¿Qué tiendas tienen más vacantes o cancelaciones sin reemplazo?
    if (q.includes('vacante') || q.includes('cancelad') || q.includes('sin reemplazo')) {
      const vacStores = stores.filter(s => s.unmatchedCancels > 0).sort((a, b) => b.unmatchedCancels - a.unmatchedCancels);
      if (vacStores.length === 0) {
        return {
          answer: `✅ **Hecho Verificado (${periodSpan}):** No se registran vacantes ni cancelaciones sin reemplazo en las tiendas bajo los filtros activos. Todas las cancelaciones fueron cubiertas satisfactoriamente.`,
          evidence: [{ item: 'Total Vacantes', value: '0 vacantes' }]
        };
      }
      const list = vacStores.slice(0, 5).map((s, idx) => `**${idx + 1}. ${s.store.split(' - ')[0]} (${s.city}):** ${s.unmatchedCancels} cancelados sin reemplazo (de ${s.cancels} cancelaciones y ${s.replacements} reemplazos).`).join('\n');
      return {
        answer: `📍 **Tiendas con mayor concentración de vacantes no cubiertas (${periodSpan}):**\n\n**Hechos Verificados:**\n${list}\n\n💡 **Hipótesis / Recomendación Operativa:** Activar lista de suplentes en turnos vespertinos y fines de semana para mitigar bajas recurrentes.`,
        evidence: vacStores.slice(0, 5).map(s => ({ item: s.store.split(' - ')[0], value: `${s.unmatchedCancels} vacantes` }))
      };
    }

    // 8. ¿Qué ciudad tiene mejor o peor desempeño?
    if (q.includes('ciudad') || q.includes('desempeño') || q.includes('peor') || q.includes('mejor')) {
      cities.forEach(c => {
        c.prod = c.hours > 0 ? (c.packages / c.hours) : 0;
        const evalDenom = (c.attendedShifts || 0) + (c.pilotCancels || 0);
        c.cancelRate = evalDenom > 0 ? ((c.pilotCancels || 0) / evalDenom) * 100 : 0;
      });
      cities.sort((a, b) => b.prod - a.prod);

      const topC = cities[0];
      const lowC = cities[cities.length - 1];

      return {
        answer: `🏙️ **Comparativo de Desempeño por Ciudad (${periodSpan}):**\n\n**Hechos Verificados:**\n• **Mejor Productividad:** **${topC.city}** con **${topC.prod.toFixed(2)} paq/h** (${topC.packages.toLocaleString()} paq en ${topC.hours.toFixed(1)}h · Cancelación ${topC.cancelRate.toFixed(1)}%).\n• **Menor Productividad:** **${lowC.city}** con **${lowC.prod.toFixed(2)} paq/h** (${lowC.packages.toLocaleString()} paq en ${lowC.hours.toFixed(1)}h · Cancelación ${lowC.cancelRate.toFixed(1)}%).\n\n🔍 **Evidencia:** Basado en ${cities.length} ciudades analizadas con un volumen total de ${filteredMalla.length.toLocaleString()} turnos.`,
        evidence: cities.map(c => ({ item: c.city, value: `${c.prod.toFixed(2)} paq/h` }))
      };
    }

    // 9. ¿Qué pilotos presentan alertas o cancelaciones?
    if (q.includes('piloto') || q.includes('asistencia') || q.includes('riesgo')) {
      const cancelPilots = pilots.filter(p => p.cancels > 0).sort((a, b) => b.cancels - a.cancels);
      if (cancelPilots.length === 0) {
        return {
          answer: `🛵 **Hecho Verificado (${periodSpan}):** No se registran cancelaciones imputables a pilotos en los filtros seleccionados.`,
          evidence: []
        };
      }
      const topP = cancelPilots.slice(0, 5).map((p, idx) => `**${idx + 1}. ${p.pilot} (${p.city}):** ${p.cancels} cancelaciones en ${p.scheduled} turnos evaluables (${p.attendancePct.toFixed(1)}% asistencia).`).join('\n');
      return {
        answer: `⚠️ **Pilotos con mayores alertas de asistencia (${periodSpan}):**\n\n**Hechos Verificados:**\n${topP}\n\n📋 **Recomendación:** Convocar a sesión de seguimiento operativo y aplicar política de reasignación de franjas.`,
        evidence: cancelPilots.slice(0, 5).map(p => ({ item: p.pilot, value: `${p.cancels} cancelaciones` }))
      };
    }

    // Respuesta general con resumen inteligente
    const _prod  = typeof kpis.fleetProductivityPaqH === 'number' ? kpis.fleetProductivityPaqH : (kpis.productividadReal || 0);
    const _cov   = typeof kpis.cuposCoveragePct === 'number'      ? kpis.cuposCoveragePct      : (kpis.coberturaAsistenciaPct || 0);
    return {
      answer: `📊 **Diagnóstico Operativo General (${periodSpan}):**\n\n**Hechos Verificados:**\nBajo los filtros activos, la operación cuenta con **${filteredMalla.length.toLocaleString()} turnos evaluados**, una productividad promedio de **${_prod.toFixed(2)} paq/h**, cobertura del **${_cov.toFixed(1)}%**, tasa de cancelación del **${(kpis.cancellationRatePct || 0).toFixed(1)}%** y **${kpis.cuposFaltantesTotal} vacantes totales**. Se identificaron **${(rulesEval && rulesEval.alertsCount) || 0} alertas operativas** (${(rulesEval && rulesEval.criticalCount) || 0} críticas).\n\nPuedes preguntar por: **tiendas, ciudades específicas, vacantes, reemplazos, adicionales, puntualidad, calidad de datos, fórmulas de KPI o pilotos**.`,
      evidence: [
        { item: 'Turnos', value: filteredMalla.length },
        { item: 'Productividad', value: `${_prod.toFixed(2)} paq/h` },
        { item: 'Cobertura', value: `${_cov.toFixed(1)}%` },
        { item: 'Vacantes', value: kpis.cuposFaltantesTotal }
      ]
    };
  }
};

if (typeof window !== 'undefined') {
  window.OperationalAIAnalyst = OperationalAIAnalyst;
}
if (typeof global !== 'undefined') {
  global.OperationalAIAnalyst = OperationalAIAnalyst;
}
