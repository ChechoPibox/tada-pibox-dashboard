// ============================================================
// MOTOR DE COBERTURA PREVENTIVA Y POOL DE SUPLENTES (MÓDULO 2)
// Monitoreo de cupos, scoring de riesgo y sugerencias de reemplazo
// ============================================================

const CoverageEngine = {

  /**
   * Analiza la cobertura de cupos en la hoja de programación (Sheet 2)
   * Aplicando la Regla Transversal de Match (Cancelados vs Reemplazos por Fecha, Tienda y Hora de Inicio)
   */
  analyzeCoverage(progShifts) {
    const storeMap = {};

    progShifts.forEach(s => {
      if (!s.store) return;
      const key = `${s.city || 'Sin Ciudad'}|${s.store.trim()}`;
      if (!storeMap[key]) {
        storeMap[key] = {
          city: s.city || '—',
          store: s.store.trim(),
          shifts: []
        };
      }
      storeMap[key].shifts.push(s);
    });

    let totalRequired = 0;
    let totalAssigned = 0;
    let totalVacant = 0;

    const storeList = Object.values(storeMap).map(st => {
      const match = typeof reconcileShiftsMatch === 'function'
        ? reconcileShiftsMatch(st.shifts)
        : {
            totalSlotsRequired: st.shifts.length,
            totalSlotsCovered: st.shifts.filter(s => !s.is_vacant).length,
            totalSlotsMissing: st.shifts.filter(s => s.is_vacant).length,
            cuposCoveragePct: 100,
            totalMatchedReplacements: 0,
            totalUnmatchedCancels: 0
          };

      const required = match.totalSlotsRequired;
      const assigned = match.totalSlotsCovered;
      const vacant = match.totalSlotsMissing;
      const covPct = Math.round(match.cuposCoveragePct);

      totalRequired += required;
      totalAssigned += assigned;
      totalVacant += vacant;

      return {
        city: st.city,
        store: st.store,
        total: required,
        assigned: assigned,
        vacant: vacant,
        matchedReplacements: match.totalMatchedReplacements || 0,
        unmatchedCancels: match.totalUnmatchedCancels || 0,
        coveragePct: covPct,
        statusBadge: vacant > 0 ? 'badge-vacante' : 'badge-completo'
      };
    }).sort((a, b) => b.vacant - a.vacant || a.coveragePct - b.coveragePct);

    return {
      totalRequired,
      totalAssigned,
      totalVacant,
      coveragePct: totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 100,
      stores: storeList
    };
  },

  /**
   * Cruza los pilotos programados con el historial de cancelaciones de la Malla (Sheet 1)
   * Genera el Scoring de Riesgo Preventivo
   */
  evaluateScheduledShiftsRisk(progShifts, mallaShifts, config = APP_CONFIG) {
    // 1. Indexar métricas históricas de pilotos en la Malla
    const pilotHistory = {};
    mallaShifts.forEach(s => {
      if (!s.pilot) return;
      const pKey = s.pilot.toLowerCase();
      if (!pilotHistory[pKey]) {
        pilotHistory[pKey] = {
          evaluable: 0,
          attended: 0,
          cancels: 0,
          shifts: []
        };
      }
      if (s.evaluable) {
        pilotHistory[pKey].evaluable++;
        if (s.attended) pilotHistory[pKey].attended++;
        if (s.pilot_cancel) pilotHistory[pKey].cancels++;
      }
      pilotHistory[pKey].shifts.push(s);
    });

    // 2. Evaluar cada turno programado
    return progShifts.map(s => {
      if (s.is_vacant) {
        return {
          ...s,
          risk: {
            level: 'vacant',
            label: '🚨 Cupo Faltante',
            badgeClass: 'badge-cupo-faltante',
            description: 'Turno sin piloto asignado. Requiere asignación urgente.',
            cancelRate: null,
            cancelCount: 0
          }
        };
      }

      const pKey = (s.pilot || '').toLowerCase();
      const hist = pilotHistory[pKey];

      if (!hist || hist.evaluable === 0) {
        return {
          ...s,
          risk: {
            level: 'unknown',
            label: '⚪ Sin Historial Previo',
            badgeClass: 'pill-neutral',
            description: 'Piloto nuevo sin historial evaluable en las últimas 3 semanas.',
            cancelRate: 0,
            cancelCount: 0
          }
        };
      }

      const cancelRate = hist.evaluable > 0 ? (hist.cancels / hist.evaluable) * 100 : 0;
      const cancelThreshold = config.riskCancelThreshold || config.cancellationYellow || 10;

      if (cancelRate > cancelThreshold || hist.cancels >= 2) {
        return {
          ...s,
          risk: {
            level: 'high',
            label: '🚨 Alto Riesgo de Cancelación',
            badgeClass: 'badge-riesgo-alto',
            description: `Tasa de cancelación del ${cancelRate.toFixed(1)}% (${hist.cancels} turnos cancelados en 3 semanas). Se recomienda tener suplente preventivo.`,
            cancelRate: Math.round(cancelRate * 10) / 10,
            cancelCount: hist.cancels
          }
        };
      } else if (cancelRate > (config.cancellationGreen || 5)) {
        return {
          ...s,
          risk: {
            level: 'medium',
            label: '⚠️ Riesgo Moderado',
            badgeClass: 'badge-riesgo-medio',
            description: `Cancelación del ${cancelRate.toFixed(1)}%. Monitorear confirmación.`,
            cancelRate: Math.round(cancelRate * 10) / 10,
            cancelCount: hist.cancels
          }
        };
      } else {
        return {
          ...s,
          risk: {
            level: 'low',
            label: '🟢 Confirmado Confiable',
            badgeClass: 'badge-riesgo-bajo',
            description: 'Baja cancelación (≤5%). Piloto altamente confiable para cumplir el turno.',
            cancelRate: Math.round(cancelRate * 10) / 10,
            cancelCount: hist.cancels
          }
        };
      }
    });
  },

  /**
   * POOL DE PILOTOS DISPONIBLES (Banca de Suplentes con los 3 Criterios Oficiales):
   *
   * 1. Que haya ido a esa TIENDA frecuentemente y con buen cumplimiento.
   * 2. Que haya tenido TURNOS SIMILARES (horario afín).
   * 3. Que sea EFECTIVO EN ESE DÍA de la semana.
   */
  suggestReplacements(targetShift, mallaShifts, progShifts) {
    if (!targetShift) return [];

    const targetCity = targetShift.city;
    const targetStore = targetShift.store;
    const targetDay = targetShift.weekday;
    const targetDate = targetShift.date;
    const targetStart = targetShift.start;

    // 1. Identificar pilotos ya ocupados en esa misma fecha y franja horaria
    const busyPilots = new Set();
    progShifts.forEach(ps => {
      if (ps.date === targetDate && !ps.is_vacant && ps.pilot) {
        busyPilots.add(ps.pilot.toLowerCase());
      }
    });

    // 2. Agrupar el historial de pilotos de la misma ciudad
    const pilotData = {};
    mallaShifts.forEach(s => {
      if (!s.pilot) return;
      if (targetCity && s.city && s.city.toLowerCase() !== targetCity.toLowerCase()) return;

      const pKey = s.pilot.toLowerCase();
      if (!pilotData[pKey]) {
        pilotData[pKey] = {
          name: s.pilot,
          pilot_id: s.pilot_id,
          phone: s.phone || '',
          city: s.city,
          totalShifts: 0,
          attendedShifts: 0,
          storeShifts: 0,
          storeAttended: 0,
          similarTimeShifts: 0,
          similarTimeAttended: 0,
          dayShifts: 0,
          dayAttended: 0
        };
      }

      const p = pilotData[pKey];
      p.totalShifts++;
      if (s.attended) p.attendedShifts++;
      if (s.phone && !p.phone) p.phone = s.phone;

      // Criterio 1: Frecuencia y cumplimiento en esa tienda
      if (targetStore && s.store && s.store.toLowerCase().includes(targetStore.toLowerCase().substring(0, 8))) {
        p.storeShifts++;
        if (s.attended) p.storeAttended++;
      }

      // Criterio 2: Turnos con horario similar (+/- 60 min)
      if (targetStart != null && s.start != null && Math.abs(s.start - targetStart) <= 60) {
        p.similarTimeShifts++;
        if (s.attended) p.similarTimeAttended++;
      }

      // Criterio 3: Efectividad en ese día de la semana
      if (targetDay && s.weekday && s.weekday.toLowerCase() === targetDay.toLowerCase()) {
        p.dayShifts++;
        if (s.attended) p.dayAttended++;
      }
    });

    // 3. Filtrar disponibles y calificar con los 3 criterios
    const candidates = [];

    Object.values(pilotData).forEach(p => {
      // Excluir si ya tiene turno en esa fecha
      if (busyPilots.has(p.name.toLowerCase())) return;

      // Excluir si el piloto tiene asistencia global menor al 80%
      const globalAssist = p.totalShifts > 0 ? (p.attendedShifts / p.totalShifts) : 0;
      if (globalAssist < 0.8) return;

      // Cálculo de Puntuación de los 3 Criterios (0 a 100):
      // Criterio 1: Tienda frecuente (40 pts)
      let scoreStore = 0;
      if (p.storeShifts >= 3) scoreStore = 40;
      else if (p.storeShifts >= 1) scoreStore = 25;
      else scoreStore = 10;

      // Criterio 2: Horario similar (30 pts)
      let scoreTime = 0;
      if (p.similarTimeShifts >= 3) scoreTime = 30;
      else if (p.similarTimeShifts >= 1) scoreTime = 20;
      else scoreTime = 10;

      // Criterio 3: Efectividad en el día de la semana (30 pts)
      let scoreDay = 0;
      if (p.dayShifts > 0) {
        const dayRate = p.dayAttended / p.dayShifts;
        scoreDay = Math.round(dayRate * 30);
      } else {
        scoreDay = 15; // neutral
      }

      const totalFitScore = scoreStore + scoreTime + scoreDay;

      candidates.push({
        ...p,
        fitScore: totalFitScore,
        globalAssistPct: Math.round(globalAssist * 100),
        storeInfo: `${p.storeShifts} turnos en tienda`,
        dayInfo: `${Math.round((p.dayAttended / (p.dayShifts || 1)) * 100)}% en ${targetDay}`
      });
    });

    // Ordenar por afinidad descendente y retornar los mejores 5
    return candidates.sort((a, b) => b.fitScore - a.fitScore || b.globalAssistPct - a.globalAssistPct).slice(0, 5);
  }
};
