// ============================================================
// ANALISTA OPERATIVO IA — TADA / PIBOX (FASE 2)
// Capa de IA desacoplada y contextual: interpreta métricas,
// detecta anomalías, responde preguntas y genera recomendaciones
// con evidencia matemática estricta (CERO alucinaciones).
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
        primaryRisks: []
      };
    }

    // Índice de Salud Operativa Transparente (0 - 100)
    // 40% Cobertura de Cupos (target 95% = 100 pts)
    // 30% Tasa de No-Cancelación (100 - cancelRate)
    // 30% Productividad (target 1.20 paq/h = 100 pts)
    const covScore = Math.min(100, Math.max(0, (kpis.coberturaAsistenciaPct / 95) * 100));
    const cancelScore = Math.max(0, 100 - (kpis.tasaCancelacionPct * 2.5));
    const prodScore = Math.min(100, Math.max(0, (kpis.productividadReal / 1.20) * 100));

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
    const cities = Object.values(rulesEval.cityStats || {});
    cities.forEach(c => {
      c.prod = c.hours > 0 ? (c.packages / c.hours) : 0;
      c.cancelRate = c.shifts.length > 0 ? (c.cancels / c.shifts.length) * 100 : 0;
    });
    cities.sort((a, b) => b.prod - a.prod);

    const bestCity = cities.length > 0 ? cities[0] : null;
    const worstCity = cities.length > 1 ? cities[cities.length - 1] : null;

    // Tiendas con más vacantes
    const stores = Object.values(rulesEval.storeStats || {});
    stores.sort((a, b) => b.unmatchedCancels - a.unmatchedCancels);
    const topMissingStores = stores.filter(s => s.unmatchedCancels > 0);

    const summaryText = `La operación registra una salud de **${healthScore}/100** (${statusLabel}), alcanzando una cobertura de cupos del **${kpis.coberturaAsistenciaPct.toFixed(1)}%** y una productividad global de **${kpis.productividadReal.toFixed(2)} paq/h** con ${kpis.totalPaquetes.toLocaleString()} paquetes entregados. Se detectaron **${kpis.cuposFaltantesTotal} vacantes totales** (${kpis.cuposFaltantesBreakdown.unmatchedCancels} cancelados sin reemplazo), concentradas principalmente en ${topMissingStores.length > 0 ? topMissingStores.slice(0, 2).map(s => s.store.split(' - ')[0]).join(' y ') : 'ninguna tienda crítica'}.`;

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
      criticalAlertsCount: rulesEval.criticalCount || 0
    };
  },

  /**
   * Responde preguntas contextuales del usuario con evidencia matemática estricta
   */
  answerQuery(query, filteredMalla, kpis, rulesEval) {
    const q = (query || '').toLowerCase().trim();
    if (!filteredMalla || filteredMalla.length === 0) {
      return {
        answer: '⚠️ No hay datos cargados para los filtros seleccionados actualmente. Por favor ajusta o restablece los filtros.',
        evidence: []
      };
    }

    const stores = Object.values(rulesEval.storeStats || {});
    const cities = Object.values(rulesEval.cityStats || {});
    const pilots = Object.values(rulesEval.pilotStats || {});

    // 1. ¿Qué tiendas tienen más vacantes o cancelaciones sin reemplazo?
    if (q.includes('vacante') || q.includes('cancelad') || q.includes('sin reemplazo')) {
      const vacStores = stores.filter(s => s.unmatchedCancels > 0).sort((a, b) => b.unmatchedCancels - a.unmatchedCancels);
      if (vacStores.length === 0) {
        return {
          answer: '✅ **Excelente desempeño de cobertura:** No se registran vacantes ni cancelaciones sin reemplazo en las tiendas bajo los filtros activos. Todas las cancelaciones fueron cubiertas satisfactoriamente.',
          evidence: [{ item: 'Total Vacantes', value: '0 vacantes' }]
        };
      }
      const list = vacStores.slice(0, 5).map((s, idx) => `**${idx + 1}. ${s.store.split(' - ')[0]} (${s.city}):** ${s.unmatchedCancels} cancelados sin reemplazo (de ${s.cancels} cancelaciones totales y ${s.replacements} reemplazos asignados).`).join('\n');
      return {
        answer: `📍 **Tiendas con mayor concentración de vacantes no cubiertas:**\n\n${list}\n\n💡 **Recomendación Operativa:** Activar lista de suplentes en turnos vespertinos y fines de semana para mitigar bajas recurrentes.`,
        evidence: vacStores.slice(0, 5).map(s => ({ item: s.store.split(' - ')[0], value: `${s.unmatchedCancels} vacantes` }))
      };
    }

    // 2. ¿Qué ciudad tiene mejor o peor desempeño?
    if (q.includes('ciudad') || q.includes('desempeño') || q.includes('peor') || q.includes('mejor')) {
      cities.forEach(c => {
        c.prod = c.hours > 0 ? (c.packages / c.hours) : 0;
        c.cancelsCount = c.cancels;
      });
      cities.sort((a, b) => b.prod - a.prod);

      const topC = cities[0];
      const lowC = cities[cities.length - 1];

      return {
        answer: `🏙️ **Comparativo de Desempeño por Ciudad:**\n\n• **Mejor Productividad:** **${topC.city}** con **${topC.prod.toFixed(2)} paq/h** (${topC.packages.toLocaleString()} paquetes en ${topC.hours.toFixed(1)}h).\n• **Mayor Oportunidad de Mejora:** **${lowC.city}** con **${lowC.prod.toFixed(2)} paq/h** (${lowC.packages.toLocaleString()} paquetes).\n\n🔍 **Evidencia:** Basado en ${cities.length} ciudades analizadas con un volumen total de ${filteredMalla.length} turnos.`,
        evidence: cities.map(c => ({ item: c.city, value: `${c.prod.toFixed(2)} paq/h` }))
      };
    }

    // 3. ¿Qué pilotos presentan alertas o cancelaciones?
    if (q.includes('piloto') || q.includes('asistencia') || q.includes('riesgo')) {
      const cancelPilots = pilots.filter(p => p.cancels > 0).sort((a, b) => b.cancels - a.cancels);
      if (cancelPilots.length === 0) {
        return {
          answer: '🛵 **Asistencia Impecable:** No se registran cancelaciones de pilotos en los filtros seleccionados.',
          evidence: []
        };
      }
      const topP = cancelPilots.slice(0, 5).map((p, idx) => `**${idx + 1}. ${p.pilot} (${p.city}):** ${p.cancels} cancelaciones en ${p.scheduled} turnos programados (${p.attendancePct.toFixed(1)}% asistencia).`).join('\n');
      return {
        answer: `⚠️ **Pilotos con mayores alertas de asistencia:**\n\n${topP}\n\n📋 **Acción sugerida:** Convocar a sesión de seguimiento operativo y aplicar política de reasignación de franjas.`,
        evidence: cancelPilots.slice(0, 5).map(p => ({ item: p.pilot, value: `${p.cancels} cancelaciones` }))
      };
    }

    // 4. Respuesta general con resumen inteligente
    return {
      answer: `📊 **Diagnóstico Operativo General:**\n\nBajo los filtros activos, la operación cuenta con **${filteredMalla.length} turnos evaluados**, una productividad promedio de **${kpis.productividadReal.toFixed(2)} paq/h**, cobertura del **${kpis.coberturaAsistenciaPct.toFixed(1)}%** y **${kpis.cuposFaltantesTotal} vacantes totales**. Se han identificado **${rulesEval.alertsCount} alertas operativas activas** (${rulesEval.criticalCount} críticas).\n\nPuedes consultar preguntas específicas sobre tiendas, ciudades, vacantes, productividad o pilotos.`,
      evidence: [
        { item: 'Turnos', value: filteredMalla.length },
        { item: 'Productividad', value: `${kpis.productividadReal.toFixed(2)} paq/h` },
        { item: 'Cobertura', value: `${kpis.coberturaAsistenciaPct.toFixed(1)}%` },
        { item: 'Vacantes', value: kpis.cuposFaltantesTotal }
      ]
    };
  }
};
