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
      const calculatedGap = Math.max(0, required - assigned);
      const vacant = Math.max(match.totalSlotsMissing || 0, calculatedGap);
      const covPct = required > 0 ? Math.round((assigned / required) * 100) : 100;

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
    }).sort((a, b) => (b.vacant - a.vacant) || (a.coveragePct - b.coveragePct));

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
    // 0. Conciliación transversal de turnos cancelados y reemplazos confirmados en la programación
    // Agrupar por (fecha, tienda normalizada, franja inicio) para correspondencia 1 a 1 verificable
    const slotGroups = {};
    progShifts.forEach(s => {
      const date = (s.date || '').trim();
      const rawStore = String(s.store || '').trim();
      if (!date || !rawStore) return;
      const storeKey = typeof normalizeKeyStr === 'function' ? normalizeKeyStr(rawStore) : rawStore.toLowerCase();
      const startMin = s.start != null ? Number(s.start) : 0;
      const key = `${date}__${storeKey}__${startMin}`;
      if (!slotGroups[key]) {
        slotGroups[key] = {
          cancels: [],
          replacements: []
        };
      }
      const rawSt = (s.status || '').toLowerCase().trim();
      const isExcluded = (
        rawSt.includes('tienda cerrada') ||
        rawSt === 'cerrada' ||
        rawSt.includes('adicional no autoriz') ||
        rawSt.includes('no autorizado') ||
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
      const isClientCancel = !isExcluded && Boolean(
        rawSt === 'cliente cancela' ||
        rawSt === 'cancela cliente' ||
        rawSt === 'cliente canceló' ||
        rawSt === 'cliente cancelo' ||
        (rawSt.includes('cliente') && rawSt.includes('cancel'))
      );
      const isReplacement = (rawSt === 'reemplazo');
      if (isPilotCancel || isClientCancel) {
        slotGroups[key].cancels.push({
          shift: s,
          isClient: isClientCancel
        });
      } else if (isReplacement) {
        slotGroups[key].replacements.push(s);
      }
    });

    // Mapeo 1 a 1 entre turnos cancelados (Piloto o Cliente) y sus reemplazos efectivamente confirmados
    const matchedCancelMap = new Map();
    Object.values(slotGroups).forEach(g => {
      const minCount = Math.min(g.cancels.length, g.replacements.length);
      for (let i = 0; i < g.cancels.length; i++) {
        const item = g.cancels[i];
        const cancelShift = item.shift;
        const isClient = item.isClient;
        if (i < minCount) {
          // Reemplazo confirmado asociado
          matchedCancelMap.set(cancelShift, {
            hasReplacement: true,
            replacementShift: g.replacements[i],
            isClient
          });
        } else {
          // Sin reemplazo confirmado
          matchedCancelMap.set(cancelShift, {
            hasReplacement: false,
            replacementShift: null,
            isClient
          });
        }
      }
    });

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
      const isEval = s.evaluable !== undefined ? Boolean(s.evaluable) : (!s.excluded && (s.attended || s.pilot_cancel));
      if (isEval) {
        pilotHistory[pKey].evaluable++;
        if (s.attended) pilotHistory[pKey].attended++;
        if (s.pilot_cancel) pilotHistory[pKey].cancels++;
      }
      pilotHistory[pKey].shifts.push(s);
    });

    // 2. Evaluar cada turno programado
    return progShifts.map(s => {
      const rawSt = (s.status || '').toLowerCase().trim();

      // Caso A: Turno cancelado por el piloto o por el cliente
      if (matchedCancelMap.has(s)) {
        const matchInfo = matchedCancelMap.get(s);
        const originLabel = matchInfo.isClient ? 'Cliente' : 'Piloto';
        const cancelEntity = matchInfo.isClient ? 'cliente' : 'el piloto';

        if (matchInfo.hasReplacement) {
          const repPilot = matchInfo.replacementShift?.pilot || 'Suplente Asignado';
          return {
            ...s,
            hasConfirmedReplacement: true,
            replacementPilot: repPilot,
            risk: {
              level: 'cancel_with_replacement',
              label: `🔄 ${originLabel} cancela (Con Reemplazo)`,
              badgeClass: 'pill-neutral',
              description: `Turno con cancelación por ${cancelEntity}. Reemplazo confirmado asignado: ${repPilot}.`,
              cancelRate: null,
              cancelCount: 0
            }
          };
        } else {
          return {
            ...s,
            hasConfirmedReplacement: false,
            replacementPilot: null,
            isUnmatchedCancel: true,
            risk: {
              level: 'cancel_unmatched',
              label: `🚨 ${originLabel} cancela sin reemplazo`,
              badgeClass: 'badge-riesgo-alto',
              description: `Turno con cancelación por ${cancelEntity} sin reemplazo confirmado en la franja horaria. Requiere asignación de suplente.`,
              cancelRate: null,
              cancelCount: 0
            }
          };
        }
      }

      // Caso B: Turno de reemplazo confirmado
      if (rawSt === 'reemplazo') {
        return {
          ...s,
          risk: {
            level: 'replacement',
            label: '✅ Reemplazo Confirmado',
            badgeClass: 'badge-optimo',
            description: 'Turno cubierto efectivamente por piloto de reemplazo confirmado.',
            cancelRate: null,
            cancelCount: 0
          }
        };
      }

      // Caso C: Cupo faltante sin piloto asignado
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

      // Caso D: Turno excluido (Tienda cerrada, Adicional no autorizado)
      const isExcludedStatus = (
        rawSt.includes('tienda cerrada') ||
        rawSt === 'cerrada' ||
        rawSt.includes('adicional no autoriz') ||
        rawSt.includes('no autorizado') ||
        rawSt.includes('cliente cancela') ||
        rawSt.includes('adicional cancel') ||
        rawSt.includes('no programado')
      );
      if (isExcludedStatus) {
        return {
          ...s,
          risk: {
            level: 'excluded',
            label: `⚪ ${s.status || 'Excluido'}`,
            badgeClass: 'pill-neutral',
            description: 'Turno excluido de penalización operativa (no atribuible al piloto).',
            cancelRate: 0,
            cancelCount: 0
          }
        };
      }

      // Caso E: Turno asignado con piloto -> Evaluar historial preventivo en Malla
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
   * Obtiene el intervalo horario de un turno en minutos desde medianoche [start, end]
   * Maneja turnos estándar de 8 horas cuando no se especifica end_time y cruces de medianoche.
   */
  getShiftTimeInterval(shift) {
    if (!shift || shift.start == null) return null;
    const start = Number(shift.start);
    let end = shift.end_time != null ? Number(shift.end_time) : (start + 480); // 480 min = 8h estándar
    if (end < start) {
      end += 1440; // Turno que cruza la medianoche (ej: 22:00 a 06:00)
    }
    return {
      start,
      end,
      duration: end - start
    };
  },

  /**
   * Determina si un turno está activo y compromete la disponibilidad real de un conductor.
   * Un turno cancelado (Piloto Cancela, Tienda Cerrada, Adicional Cancelado) o vacante NO compromete al conductor.
   */
  isShiftActiveCommitment(shift) {
    if (!shift || shift.is_vacant) return false;
    const pilotName = (shift.pilot || '').trim();
    if (!pilotName || pilotName === '[SIN ASIGNAR]') return false;

    // Verificar si el estado es de cancelación
    const statusStr = (shift.status || '').toLowerCase().trim();
    if (
      statusStr.includes('cancela') ||
      statusStr.includes('canceló') ||
      statusStr.includes('cerrada') ||
      statusStr.includes('no programado')
    ) {
      return false;
    }

    if (typeof classifyShiftStatus === 'function') {
      const cls = classifyShiftStatus(shift.status);
      if (cls && (cls.pilotCancel || cls.excluded)) {
        return false;
      }
    }

    return true;
  },

  /**
   * Comprueba si dos turnos en el mismo día presentan conflicto de horario o cruce de franjas,
   * teniendo en cuenta los tiempos de desplazamiento entre tiendas distintas.
   */
  checkShiftTimeConflict(shiftA, shiftB, options = {}) {
    if (!shiftA || !shiftB) return false;

    // 1. Validar fecha (con normalización robusta de fecha a nivel de día)
    const dateA = typeof parseHybridDate === 'function' ? parseHybridDate(shiftA.date) : String(shiftA.date || '').split('T')[0];
    const dateB = typeof parseHybridDate === 'function' ? parseHybridDate(shiftB.date) : String(shiftB.date || '').split('T')[0];
    if (!dateA || !dateB || dateA !== dateB) {
      return false; // Fechas distintas -> No hay conflicto
    }

    // 2. Obtener intervalos horarios
    const intA = this.getShiftTimeInterval(shiftA);
    const intB = this.getShiftTimeInterval(shiftB);
    if (!intA || !intB) {
      // Si alguno no tiene hora definida en el mismo día, se asume superposición por precaución
      return true;
    }

    // 3. Determinar tiempo de desplazamiento entre tiendas
    const storeA = (shiftA.store || '').trim().toLowerCase();
    const storeB = (shiftB.store || '').trim().toLowerCase();
    const isSameStore = storeA && storeB && storeA === storeB;

    // Desplazamiento mínimo oficial entre tiendas distintas: 30 minutos (configurable vía options)
    const displacementBuffer = isSameStore ? 0 : (options.displacementBufferMinutes ?? 30);

    // 4. Comprobar superposición de intervalos con buffer de traslado
    // Hay conflicto si: el inicio de A es anterior al fin de B (+ buffer) Y el fin de A (+ buffer) es posterior al inicio de B
    const conflict = (intA.start < (intB.end + displacementBuffer)) &&
                     ((intA.end + displacementBuffer) > intB.start);

    return conflict;
  },

  /**
   * Compara si dos objetos o referencias corresponden al mismo piloto (por ID o por Nombre)
   */
  isSamePilot(pilotObjA, pilotObjB) {
    if (!pilotObjA || !pilotObjB) return false;

    const idA = (pilotObjA.pilot_id || '').trim();
    const idB = (pilotObjB.pilot_id || '').trim();
    if (idA && idB && idA === idB) return true;

    const nameA = typeof normalizeKeyStr === 'function'
      ? normalizeKeyStr(pilotObjA.name || pilotObjA.pilot || '')
      : (pilotObjA.name || pilotObjA.pilot || '').trim().toLowerCase();
    const nameB = typeof normalizeKeyStr === 'function'
      ? normalizeKeyStr(pilotObjB.name || pilotObjB.pilot || '')
      : (pilotObjB.name || pilotObjB.pilot || '').trim().toLowerCase();

    return Boolean(nameA && nameB && nameA === nameB);
  },

  /**
   * Valida la disponibilidad de un piloto frente a todas las tiendas y programaciones activas del sistema.
   * Retorna { available: true } o { available: false, reason, conflictingShift }
   */
  validatePilotAvailability(pilotCandidate, targetShift, progShifts, options = {}) {
    if (!pilotCandidate || !targetShift) {
      return { available: false, reason: 'Parámetros de turno o piloto inválidos' };
    }

    const allProg = progShifts || [];
    for (const ps of allProg) {
      // Ignorar el mismo turno que se intenta cubrir
      if (ps === targetShift) continue;

      // Solo turnos con compromiso activo (no vacantes, no cancelados)
      if (!this.isShiftActiveCommitment(ps)) continue;

      // Verificar si es el mismo piloto
      if (this.isSamePilot(pilotCandidate, ps)) {
        // Verificar si se cruzan en fecha y franja horaria
        if (this.checkShiftTimeConflict(ps, targetShift, options)) {
          const storeName = ps.store || 'Otra Tienda';
          const startTime = typeof fmtMinutes === 'function' ? fmtMinutes(ps.start) : `${Math.floor(ps.start/60)}:${ps.start%60}`;
          const intPs = this.getShiftTimeInterval(ps);
          const endTime = typeof fmtMinutes === 'function' && intPs ? fmtMinutes(intPs.end % 1440) : '';
          return {
            available: false,
            reason: `El piloto ya tiene un turno activo en ${storeName} (${startTime}${endTime ? ' - ' + endTime : ''}) que se cruza con este horario.`,
            conflictingShift: ps
          };
        }
      }
    }

    return { available: true };
  },

  /**
   * POOL DE PILOTOS DISPONIBLES (Banca de Suplentes con los 3 Criterios Oficiales y Validación Anti-Conflicto):
   *
   * 1. Que haya ido a esa TIENDA frecuentemente y con buen cumplimiento.
   * 2. Que haya tenido TURNOS SIMILARES (horario afín).
   * 3. Que sea EFECTIVO EN ESE DÍA de la semana.
   * + Validación entre tiendas: Excluye automáticamente a pilotos con turnos activos superpuestos.
   * + Control de duplicidad: Garantiza que ningún piloto aparezca repetido en las sugerencias.
   */
  suggestReplacements(targetShift, mallaShifts, progShifts, options = {}) {
    if (!targetShift) return [];

    const targetCity = targetShift.city;
    const targetStore = targetShift.store;
    const targetDay = targetShift.weekday;
    const targetStart = targetShift.start;

    // 1. Agrupar el historial de pilotos de la misma ciudad (Deduplicación estricta por ID o Nombre)
    const pilotData = {};
    (mallaShifts || []).forEach(s => {
      if (!s.pilot) return;
      if (targetCity && s.city && s.city.toLowerCase() !== targetCity.toLowerCase()) return;

      const pKey = (s.pilot_id && s.pilot_id.trim())
        ? `ID_${s.pilot_id.trim().toLowerCase()}`
        : (typeof normalizeKeyStr === 'function' ? normalizeKeyStr(s.pilot) : s.pilot.trim().toLowerCase());

      if (!pilotData[pKey]) {
        pilotData[pKey] = {
          name: s.pilot.trim(),
          pilot_id: (s.pilot_id || '').trim(),
          phone: (s.phone || '').trim(),
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
      if (s.phone && !p.phone) p.phone = s.phone.trim();
      if (s.pilot_id && !p.pilot_id) p.pilot_id = s.pilot_id.trim();

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

    // 2. Filtrar disponibles y calificar con los 3 criterios
    const candidates = [];
    const seenCandidateKeys = new Set();

    Object.values(pilotData).forEach(p => {
      // Control de Duplicidad estricto: evita proponer al mismo conductor dos veces
      const dedupeKey = p.pilot_id ? `ID_${p.pilot_id}` : (typeof normalizeKeyStr === 'function' ? normalizeKeyStr(p.name) : p.name.toLowerCase());
      if (seenCandidateKeys.has(dedupeKey)) return;

      // Validación de Disponibilidad Real frente a TODAS las programaciones del sistema
      const availability = this.validatePilotAvailability(p, targetShift, progShifts, options);
      if (!availability.available) {
        // Excluido automáticamente por cruce de franja u horario en cualquier tienda
        return;
      }

      // Excluir si el piloto tiene asistencia global menor al 80%
      const globalAssist = p.totalShifts > 0 ? (p.attendedShifts / p.totalShifts) : 0;
      if (globalAssist < 0.8) return;

      // Comprobar si el piloto tiene otro turno independiente ese mismo día (sin cruce horario)
      let sameDayNote = null;
      const targetDateNorm = typeof parseHybridDate === 'function' ? parseHybridDate(targetShift.date) : String(targetShift.date || '').split('T')[0];
      const sameDayShift = (progShifts || []).find(ps => {
        if (!this.isShiftActiveCommitment(ps)) return false;
        if (!this.isSamePilot(p, ps)) return false;
        const psDateNorm = typeof parseHybridDate === 'function' ? parseHybridDate(ps.date) : String(ps.date || '').split('T')[0];
        return psDateNorm === targetDateNorm;
      });

      if (sameDayShift) {
        const intPs = this.getShiftTimeInterval(sameDayShift);
        const startStr = typeof fmtMinutes === 'function' ? fmtMinutes(sameDayShift.start) : '';
        const endStr = typeof fmtMinutes === 'function' && intPs ? fmtMinutes(intPs.end % 1440) : '';
        sameDayNote = `Turno en ${sameDayShift.store || 'otra tienda'} (${startStr} - ${endStr}) sin cruce horario`;
      }

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

      seenCandidateKeys.add(dedupeKey);
      candidates.push({
        ...p,
        fitScore: totalFitScore,
        globalAssistPct: Math.round(globalAssist * 100),
        storeInfo: `${p.storeShifts} turnos en tienda`,
        dayInfo: `${Math.round((p.dayAttended / (p.dayShifts || 1)) * 100)}% en ${targetDay}`,
        sameDayNote
      });
    });

    // Ordenar por afinidad descendente y retornar los mejores 6 candidatos únicos
    return candidates.sort((a, b) => b.fitScore - a.fitScore || b.globalAssistPct - a.globalAssistPct).slice(0, 6);
  }
};
