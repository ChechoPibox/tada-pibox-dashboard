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
  validatePilotAvailability(pilotCandidate, targetShift, progShifts, mallaShifts = null, options = {}) {
    if (!pilotCandidate || !targetShift) {
      return { available: false, reason: 'Parámetros de turno o piloto inválidos' };
    }

    // Excluir al mismo piloto titular asignado actualmente al turno
    if (this.isSamePilot(pilotCandidate, targetShift)) {
      return {
        available: false,
        reason: 'El conductor seleccionado es el titular actualmente asignado a este turno.'
      };
    }

    const allProg = progShifts || (typeof AppState !== 'undefined' ? AppState.progShifts : []);
    const allMalla = mallaShifts || (typeof AppState !== 'undefined' ? AppState.mallaShifts : []);

    const targetDateNorm = typeof parseHybridDate === 'function' ? parseHybridDate(targetShift.date) : String(targetShift.date || '').split('T')[0];
    const targetDay = (targetShift.weekday || '').trim().toLowerCase();

    // 1. Revisar programaciones activas (progShifts)
    for (const ps of allProg) {
      if (ps === targetShift) continue;
      if (!this.isShiftActiveCommitment(ps)) continue;

      if (this.isSamePilot(pilotCandidate, ps)) {
        const psDateNorm = typeof parseHybridDate === 'function' ? parseHybridDate(ps.date) : String(ps.date || '').split('T')[0];
        const sameDate = Boolean(targetDateNorm && psDateNorm && targetDateNorm === psDateNorm);
        const sameWeekday = Boolean(!targetDateNorm && targetDay && ps.weekday && ps.weekday.toLowerCase() === targetDay);

        if (sameDate || sameWeekday) {
          const storeName = ps.store || 'Otra Tienda';
          const startTime = typeof fmtMinutes === 'function' ? fmtMinutes(ps.start) : `${ps.start}`;
          const intPs = this.getShiftTimeInterval(ps);
          const endTime = typeof fmtMinutes === 'function' && intPs ? fmtMinutes(intPs.end % 1440) : '';

          // Cruce horario / franja
          if (this.checkShiftTimeConflict(ps, targetShift, options)) {
            return {
              available: false,
              reason: `El piloto ya tiene un turno activo en ${storeName} (${startTime} - ${endTime}) que se cruza con este horario.`,
              conflictingShift: ps
            };
          }

          // Conflicto de estar programado en el día
          if (options.requireDayFree !== false) {
            return {
              available: false,
              reason: `El piloto ya está programado en ${storeName} (${startTime} - ${endTime}) en la misma fecha.`,
              conflictingShift: ps
            };
          }
        }
      }
    }

    // 2. Revisar compromisos en malla de turnos (mallaShifts)
    for (const ms of (allMalla || [])) {
      if (ms === targetShift) continue;
      if (!ms.pilot || ms.pilot === '[SIN ASIGNAR]') continue;

      if (this.isSamePilot(pilotCandidate, ms)) {
        const msDateNorm = typeof parseHybridDate === 'function' ? parseHybridDate(ms.date) : String(ms.date || '').split('T')[0];
        const sameDate = Boolean(targetDateNorm && msDateNorm && targetDateNorm === msDateNorm);
        const sameWeekday = Boolean(!targetDateNorm && targetDay && ms.weekday && ms.weekday.toLowerCase() === targetDay);

        if (sameDate || sameWeekday) {
          const isCommitment = ms.attended === true || (!ms.pilot_cancel && !(typeof isOperationalShiftExcluded === 'function' && isOperationalShiftExcluded(ms.status)));
          if (isCommitment) {
            const storeName = ms.store || 'Otra Tienda';
            const startTime = typeof fmtMinutes === 'function' ? fmtMinutes(ms.start) : `${ms.start}`;
            const intMs = this.getShiftTimeInterval(ms);
            const endTime = typeof fmtMinutes === 'function' && intMs ? fmtMinutes(intMs.end % 1440) : '';

            if (this.checkShiftTimeConflict(ms, targetShift, options)) {
              return {
                available: false,
                reason: `El piloto ya cuenta con un turno registrado en ${storeName} (${startTime} - ${endTime}) con cruce de horario.`,
                conflictingShift: ms
              };
            }

            if (options.requireDayFree !== false) {
              return {
                available: false,
                reason: `El piloto ya tiene un turno en ${storeName} (${startTime} - ${endTime}) en esta fecha.`,
                conflictingShift: ms
              };
            }
          }
        }
      }
    }

    return { available: true };
  },

  /**
   * POOL DE PILOTOS DISPONIBLES (Banca de Suplentes de Alto Rendimiento y Validación Anti-Conflicto):
   *
   * 1. CONDICIÓN PRIMORDIAL: Pilotos NO PROGRAMADOS EN EL DÍA NI EN LA FRANJA (100% libres en la fecha).
   * 2. CRITERIO DE ORDENAMIENTO RECTOR: MEJOR ASISTENCIA (%) comprobada de mayor a menor.
   * 3. CRITERIOS COMPLEMENTARIOS: Experiencia en la tienda, horario afín y volumen de turnos asistidos.
   */
  suggestReplacements(targetShift, mallaShifts, progShifts, options = {}) {
    if (!targetShift) return [];

    let targetCity = (targetShift.city || '').trim();
    const targetStore = (targetShift.store || '').trim();
    const targetDay = (targetShift.weekday || '').trim();
    const targetStart = targetShift.start != null ? Number(targetShift.start) : null;
    const targetDateNorm = typeof parseHybridDate === 'function' ? parseHybridDate(targetShift.date) : String(targetShift.date || '').split('T')[0];

    // Inferir ciudad si no viene explícita en targetShift
    if (!targetCity && targetStore) {
      const foundInProg = (progShifts || []).find(s => s.store === targetStore && s.city);
      const foundInMalla = (mallaShifts || []).find(s => s.store === targetStore && s.city);
      targetCity = (foundInProg?.city || foundInMalla?.city || '').trim();
    }

    // 1. Agrupar el historial operativo de pilotos de la misma ciudad
    const pilotData = {};
    (mallaShifts || []).forEach(s => {
      if (!s.pilot || s.pilot === '[SIN ASIGNAR]') return;
      if (targetCity && s.city && s.city.toLowerCase() !== targetCity.toLowerCase()) return;

      const pKey = (s.pilot_id && s.pilot_id.trim())
        ? `ID_${s.pilot_id.trim().toLowerCase()}`
        : (typeof normalizeKeyStr === 'function' ? normalizeKeyStr(s.pilot) : s.pilot.trim().toLowerCase());

      if (!pilotData[pKey]) {
        pilotData[pKey] = {
          name: s.pilot.trim(),
          pilot_id: (s.pilot_id || '').trim(),
          phone: (s.phone || '').trim(),
          city: s.city || targetCity,
          totalShifts: 0,
          attendedShifts: 0,
          pilotCancels: 0,
          evaluableShifts: 0,
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

      const isAttended = Boolean(s.attended) || (
        String(s.status || '').toLowerCase().trim() === 'confirmado' ||
        String(s.status || '').toLowerCase().trim() === 'reemplazo' ||
        String(s.status || '').toLowerCase().trim().includes('adicional')
      );
      const isCancel = typeof isOperationalPilotCancel === 'function' ? isOperationalPilotCancel(s) : Boolean(s.pilot_cancel);

      if (isAttended) {
        p.attendedShifts++;
        p.evaluableShifts++;
      } else if (isCancel) {
        p.pilotCancels++;
        p.evaluableShifts++;
      }

      if (s.phone && !p.phone) p.phone = s.phone.trim();
      if (s.pilot_id && !p.pilot_id) p.pilot_id = s.pilot_id.trim();

      // Criterio 1: Frecuencia y cumplimiento en esa tienda
      if (targetStore && s.store && s.store.toLowerCase().includes(targetStore.toLowerCase().substring(0, 8))) {
        p.storeShifts++;
        if (isAttended) p.storeAttended++;
      }

      // Criterio 2: Turnos con horario similar (+/- 60 min)
      if (targetStart != null && s.start != null && Math.abs(s.start - targetStart) <= 60) {
        p.similarTimeShifts++;
        if (isAttended) p.similarTimeAttended++;
      }

      // Criterio 3: Efectividad en ese día de la semana
      if (targetDay && s.weekday && s.weekday.toLowerCase() === targetDay.toLowerCase()) {
        p.dayShifts++;
        if (isAttended) p.dayAttended++;
      }
    });

    // Enriquecer datos con progShifts (para teléfonos, IDs y pilotos registrados en programación)
    (progShifts || []).forEach(ps => {
      if (!ps.pilot || ps.is_vacant || ps.pilot === '[SIN ASIGNAR]') return;
      if (targetCity && ps.city && ps.city.toLowerCase() !== targetCity.toLowerCase()) return;
      const pKey = (ps.pilot_id && ps.pilot_id.trim())
        ? `ID_${ps.pilot_id.trim().toLowerCase()}`
        : (typeof normalizeKeyStr === 'function' ? normalizeKeyStr(ps.pilot) : ps.pilot.trim().toLowerCase());
      if (pilotData[pKey]) {
        if (!pilotData[pKey].phone && ps.phone) pilotData[pKey].phone = ps.phone.trim();
        if (!pilotData[pKey].pilot_id && ps.pilot_id) pilotData[pKey].pilot_id = ps.pilot_id.trim();
      }
    });

    // 2. Filtrar disponibles y calificar con prioridad en ASISTENCIA y CERO TURNOS EN EL DÍA
    const candidates = [];
    const seenCandidateKeys = new Set();

    // Búsqueda Fase 1: Pilotos estrictamente libres en todo el día (requireDayFree: true)
    Object.values(pilotData).forEach(p => {
      const dedupeKey = p.pilot_id ? `ID_${p.pilot_id}` : (typeof normalizeKeyStr === 'function' ? normalizeKeyStr(p.name) : p.name.toLowerCase());
      if (seenCandidateKeys.has(dedupeKey)) return;

      // No sugerir al mismo piloto titular
      if (this.isSamePilot(p, targetShift)) return;

      // Asistencia mínima requerida (≥80%)
      const evaluable = p.evaluableShifts > 0 ? p.evaluableShifts : p.totalShifts;
      const attendancePct = evaluable > 0 ? ((p.attendedShifts / evaluable) * 100) : 0;
      if (attendancePct < 80) return;

      // Validación estricta de disponibilidad: Cero turnos en el día y sin cruce de franja
      const availability = this.validatePilotAvailability(p, targetShift, progShifts, mallaShifts, {
        requireDayFree: true,
        ...options
      });
      if (!availability.available) return;

      // Puntuación de idoneidad técnica:
      // - 60% peso en porcentaje de asistencia comprobada
      // - 15% peso en volumen histórico de cumplimiento
      // - 15% peso en conocimiento de la tienda
      // - 10% peso en afinidad horaria
      const scoreAssist = Math.round((attendancePct / 100) * 60);
      let scoreVolume = p.attendedShifts >= 12 ? 15 : (p.attendedShifts >= 6 ? 10 : (p.attendedShifts >= 2 ? 5 : 0));
      let scoreStore = p.storeShifts >= 3 ? 15 : (p.storeShifts >= 1 ? 8 : 0);
      let scoreTime = p.similarTimeShifts >= 3 ? 10 : (p.similarTimeShifts >= 1 ? 5 : 0);

      const totalFitScore = Math.min(100, scoreAssist + scoreVolume + scoreStore + scoreTime);

      seenCandidateKeys.add(dedupeKey);
      candidates.push({
        ...p,
        fitScore: totalFitScore,
        globalAssistPct: +attendancePct.toFixed(1),
        evaluableCount: evaluable,
        storeInfo: p.storeShifts > 0 ? `Conoce la tienda (${p.storeShifts} turnos)` : 'Nueva tienda',
        dayInfo: p.dayShifts > 0 ? `${p.dayShifts} turnos en ${targetDay}` : `Disponible en ${targetDay}`,
        sameDayStatus: '🟢 Sin turnos en el día ni en la franja'
      });
    });

    // Búsqueda Fase 2 (Contingencia): Si no hay pilotos 100% libres todo el día, sugerir pilotos sin cruce de horario
    if (candidates.length === 0) {
      Object.values(pilotData).forEach(p => {
        const dedupeKey = p.pilot_id ? `ID_${p.pilot_id}` : (typeof normalizeKeyStr === 'function' ? normalizeKeyStr(p.name) : p.name.toLowerCase());
        if (seenCandidateKeys.has(dedupeKey)) return;
        if (this.isSamePilot(p, targetShift)) return;

        const evaluable = p.evaluableShifts > 0 ? p.evaluableShifts : p.totalShifts;
        const attendancePct = evaluable > 0 ? ((p.attendedShifts / evaluable) * 100) : 0;
        if (attendancePct < 80) return;

        // Solo permitir sin cruce de franja horaria
        const availability = this.validatePilotAvailability(p, targetShift, progShifts, mallaShifts, {
          requireDayFree: false,
          ...options
        });
        if (!availability.available) return;

        const scoreAssist = Math.round((attendancePct / 100) * 60);
        let scoreVolume = p.attendedShifts >= 10 ? 15 : (p.attendedShifts >= 4 ? 8 : 4);
        let scoreStore = p.storeShifts >= 2 ? 15 : (p.storeShifts >= 1 ? 8 : 0);
        let scoreTime = p.similarTimeShifts >= 2 ? 10 : 0;
        const totalFitScore = Math.min(100, scoreAssist + scoreVolume + scoreStore + scoreTime);

        seenCandidateKeys.add(dedupeKey);
        candidates.push({
          ...p,
          fitScore: totalFitScore,
          globalAssistPct: +attendancePct.toFixed(1),
          evaluableCount: evaluable,
          storeInfo: p.storeShifts > 0 ? `Conoce la tienda (${p.storeShifts} turnos)` : 'Nueva tienda',
          dayInfo: p.dayShifts > 0 ? `${p.dayShifts} turnos en ${targetDay}` : `Disponible en ${targetDay}`,
          sameDayStatus: '⚠️ Turno en otra franja sin cruce'
        });
      });
    }

    // ORDENAMIENTO PRIORITARIO:
    // 1. Mayor porcentaje de asistencia (100% > 95% > 90%...)
    // 2. Mayor puntuación de afinidad operativa (fitScore)
    // 3. Mayor cantidad de turnos asistidos comprobados
    return candidates.sort((a, b) => {
      if (b.globalAssistPct !== a.globalAssistPct) {
        return b.globalAssistPct - a.globalAssistPct;
      }
      if (b.fitScore !== a.fitScore) {
        return b.fitScore - a.fitScore;
      }
      return b.attendedShifts - a.attendedShifts;
    }).slice(0, 8);
  }
};
