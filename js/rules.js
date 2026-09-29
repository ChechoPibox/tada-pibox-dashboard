// ============================================================
// REGLAS OFICIALES DE NEGOCIO Y CÁLCULOS - TADA / PIBOX
// Incluye Match Compuesto [Punto + Día + Inicio] y Reglas Visuales CSS
// ============================================================

/**
 * Normaliza cualquier formato de fecha (DD/MM/AAAA, AAAA-MM-DD, D/M/AAAA, con o sin hora) a YYYY-MM-DD
 */
function parseHybridDate(val) {
  if (!val) return '';
  // Separar fecha de posibles horas o zonas (ej: '2026-09-14 00:00:00' o '14/09/2026 12:00')
  const s = String(val).trim().split(' ')[0].split('T')[0];
  // Formato DD/MM/AAAA, D/M/AAAA, DD-MM-AAAA
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
 * Convierte un string de fecha o Date a un objeto Date con corte de hora exacto a las 12:00 PM (mediodía)
 * Elimina cualquier problema de desfasaje de zona horaria o salto de medianoche (00:00 vs 23:59).
 */
function parseDateToNoon(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const d = new Date(dateInput);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  const iso = parseHybridDate(dateInput);
  if (!iso || iso.length < 10) return null;
  const parts = iso.substring(0, 10).split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d, 12, 0, 0, 0);
}

/**
 * Formatea un objeto Date a string ISO 'YYYY-MM-DD' usando la fecha local al mediodía (12:00 PM)
 */
function formatDateToNoonIso(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Valida si la fecha del turno cae dentro del rango [fromStr, toStr]
 * evaluando con corte horario estricto de 12:00 PM para interpretar cada día puntual.
 */
function isDateInRangeWithNoonCut(shiftDateStr, fromStr, toStr) {
  if (!shiftDateStr) return false;
  const shiftDate = parseDateToNoon(shiftDateStr);
  if (!shiftDate) return false;
  const shiftTime = shiftDate.getTime();

  if (fromStr) {
    const fromDate = parseDateToNoon(fromStr);
    if (fromDate && shiftTime < fromDate.getTime()) {
      return false;
    }
  }

  if (toStr) {
    const toDate = parseDateToNoon(toStr);
    if (toDate && shiftTime > toDate.getTime()) {
      return false;
    }
  }

  return true;
}


/**
 * Normaliza y clasifica el estado de un turno según normativa oficial TaDa/Pibox.
 *
 * TURNOS CUMPLIDOS (+ asistencia):
 *  - Confirmado, Reemplazo, Adicional, Adicional autorizado, Adicional Tada
 *
 * TURNOS NO CUMPLIDOS (- asistencia, + cancelación):
 *  - Piloto Cancela
 *
 * TURNOS EXCLUIDOS (NO entran al denominador de asistencia/cancelación):
 *  - Cliente cancela, Tienda Cerrada, Adicional Cancelado, No Programado
 */
function classifyShiftStatus(rawStatus) {
  const s = String(rawStatus || '').trim().toLowerCase();

  // Estados cumplidos
  if (
    s === 'confirmado' ||
    s === 'reemplazo' ||
    s === 'adicional' ||
    s === 'adicional autorizado' ||
    s === 'adicional tada'
  ) {
    return {
      status: rawStatus,
      evaluable: true,
      attended: true,
      pilotCancel: false,
      excluded: false,
      category: 'CUMPLIDO'
    };
  }

  // Estados cancelados por piloto
  if (s === 'piloto cancela' || s === 'cancela piloto' || s === 'piloto canceló') {
    return {
      status: rawStatus,
      evaluable: true,
      attended: false,
      pilotCancel: true,
      excluded: false,
      category: 'PILOTO_CANCELA'
    };
  }

  // Estados excluidos según normativa oficial (no afectan responsabilidad del piloto)
  return {
    status: rawStatus,
    evaluable: false,
    attended: false,
    pilotCancel: false,
    excluded: true,
    category: 'EXCLUIDO'
  };
}

/**
 * Normaliza nombres para comparación flexible de tiendas y días
 */
function normalizeKeyStr(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_–]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Realiza una coincidencia exacta de datos (Match) cruzando la hoja de productividad
 * mediante la clave compuesta: [PUNTO + DÍA DE LA SEMANA + INICIO DE TURNO]
 *
 * Retorna el valor PROM. PAQ (meta esperada)
 */
function findProductivityTargetExact(store, weekday, startMinutes) {
  if (typeof PRODUCTIVITY_TARGETS === 'undefined' || !PRODUCTIVITY_TARGETS.length) return null;
  if (!store) return null;

  const nStore = normalizeKeyStr(store);
  const nDay = normalizeKeyStr(weekday);

  // 1. Coincidencia exacta con tolerancia de inicio de turno (+/- 30 min)
  if (nDay && startMinutes != null) {
    const match = PRODUCTIVITY_TARGETS.find(m => {
      const matchStore = normalizeKeyStr(m.store) === nStore ||
                         nStore.includes(normalizeKeyStr(m.store)) ||
                         normalizeKeyStr(m.store).includes(nStore);
      const matchDay = normalizeKeyStr(m.weekday) === nDay;
      const matchTime = m.start_minutes != null && Math.abs(m.start_minutes - startMinutes) <= 30;
      return matchStore && matchDay && matchTime && m.target_packages != null;
    });
    if (match) return match.target_packages;
  }

  // 2. Coincidencia por Punto + Día
  if (nDay) {
    const dayMatches = PRODUCTIVITY_TARGETS.filter(m => {
      const matchStore = normalizeKeyStr(m.store) === nStore ||
                         nStore.includes(normalizeKeyStr(m.store)) ||
                         normalizeKeyStr(m.store).includes(nStore);
      const matchDay = normalizeKeyStr(m.weekday) === nDay;
      return matchStore && matchDay && m.target_packages != null;
    });
    if (dayMatches.length > 0) {
      const sum = dayMatches.reduce((acc, m) => acc + m.target_packages, 0);
      return Math.round((sum / dayMatches.length) * 10) / 10;
    }
  }

  // 3. Promedio histórico de la tienda
  const storeMatches = PRODUCTIVITY_TARGETS.filter(m => {
    return (normalizeKeyStr(m.store) === nStore ||
            nStore.includes(normalizeKeyStr(m.store)) ||
            normalizeKeyStr(m.store).includes(nStore)) &&
            m.target_packages != null;
  });
  if (storeMatches.length > 0) {
    const sum = storeMatches.reduce((acc, m) => acc + m.target_packages, 0);
    return Math.round((sum / storeMatches.length) * 10) / 10;
  }

  return null;
}

/**
 * Evalúa el rendimiento real vs meta esperada aplicando los 4 nuevos rangos oficiales:
 *  🟢 Productivo: > 95.0%
 *  🟡 Productividad Aceptable: 90.0% - 94.99%
 *  🟠 Productividad Baja: 75.0% - 89.99%
 *  🔴 Improductivo: < 74.99%
 * Conectado a umbrales parametrizables en APP_CONFIG
 */
function evaluateProductivityMatch(realPackages, expectedTarget, config = (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : DEFAULT_CONFIG)) {
  if (expectedTarget == null || expectedTarget <= 0) {
    return {
      ratioPct: null,
      level: 'none',
      label: 'Sin Meta',
      badgeClass: 'pill-neutral',
      color: '#9ca3af'
    };
  }

  const real = Number(realPackages) || 0;
  const ratioPct = Math.round((real / expectedTarget) * 1000) / 10; // 1 decimal para calibración precisa

  const thProductive = config?.prodThresholdProductive ?? 95.0;
  const thAcceptable = config?.prodThresholdAcceptable ?? 90.0;
  const thLow = config?.prodThresholdLow ?? 75.0;

  if (ratioPct >= thProductive) {
    return {
      ratioPct,
      level: 'productivo',
      label: 'Productivo',
      badgeClass: 'badge-optimo',
      color: '#10b981',
      description: `Productivo: Rendimiento superior a la meta (> ${thProductive}%).`
    };
  } else if (ratioPct >= thAcceptable) {
    return {
      ratioPct,
      level: 'aceptable',
      label: 'Productividad Aceptable',
      badgeClass: 'badge-aceptable',
      color: '#f59e0b',
      description: `Productividad Aceptable (${thAcceptable}% - ${(thProductive - 0.01).toFixed(2)}%).`
    };
  } else if (ratioPct >= thLow) {
    return {
      ratioPct,
      level: 'baja',
      label: 'Productividad Baja',
      badgeClass: 'badge-baja',
      color: '#f97316',
      description: `Productividad Baja (${thLow}% - ${(thAcceptable - 0.01).toFixed(2)}%).`
    };
  } else {
    return {
      ratioPct,
      level: 'improductivo',
      label: 'Improductivo',
      badgeClass: 'badge-bajo',
      color: '#ef4444',
      description: `Improductivo (< ${(thLow - 0.01).toFixed(2)}%). Requiere atención operativa.`
    };
  }
}

/**
 * Evalúa puntualidad con la regla oficial de gabela:
 * - Gabela Turnos 09:00: Llegada permitida hasta las 10:15 (615 minutos).
 * - Gabela Demás Turnos: Margen máximo de 30 minutos tras la hora de inicio (start + 30).
 */
function isShiftPunctualWithGabela(startMinutes, arrivalMinutes) {
  if (startMinutes == null || arrivalMinutes == null || isNaN(startMinutes) || isNaN(arrivalMinutes)) {
    return null;
  }
  const s = Number(startMinutes);
  const a = Number(arrivalMinutes);

  // Turno de las 09:00 (540 minutos, tolerancia +/- 15 min al inicio)
  if (Math.abs(s - 540) <= 15) {
    return a <= 615; // Hasta las 10:15
  }

  // Demás turnos: 30 minutos de margen
  return a <= (s + 30);
}

function normalizeShiftStartMin(s) {
  if (s == null) return -1;
  const val = s.start != null ? s.start : (s.start_str || s.time_start);
  if (val == null || val === '') return -1;
  if (typeof val === 'number') {
    if (val >= 0 && val <= 1) return Math.round(val * 1440);
    if (val > 1 && val <= 24) return Math.round(val * 60);
    return Math.round(val);
  }
  const str = String(val).trim();
  if (str.includes(':')) {
    const parts = str.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }
  const num = parseFloat(str);
  if (!isNaN(num)) {
    if (num >= 0 && num <= 1) return Math.round(num * 1440);
    if (num > 1 && num <= 24) return Math.round(num * 60);
    return Math.round(num);
  }
  return -1;
}

/**
 * REGLA TRANSVERSAL DE MATCH (Cancelados vs Reemplazos)
 * 1. Cada fila con tienda y fecha filtrada se interpreta como un turno operativo.
 * 2. Clave Compuesta de Match: [FECHA + TIENDA + HORA INICIO TURNO]
 * 3. Conciliación y balance:
 *    - 1 Piloto Cancela + 1 Reemplazo = 1 turno cubierto (0 faltantes, 1 requerido).
 *    - 2 Piloto Cancela + 1 Reemplazo = 1 cubierto y 1 faltante (2 requeridos).
 *    - 1 Piloto Cancela + 0 Reemplazo = 0 cubiertos y 1 faltante (1 requerido).
 *    - Activos confirmados + Reemplazos = Turnos cubiertos.
 *    - Unmatched Cancels + No Programados + Sin Piloto = Turnos faltantes.
 *    - Requeridos = Cubiertos + Faltantes.
 * Esta regla aplica para todas las tarjetas y módulos al medir turnos cubiertos y pendientes/faltantes.
 */
function reconcileShiftsMatch(shifts) {
  const groups = {};

  shifts.forEach(s => {
    // Si no tiene tienda ni fecha, no es un turno de tienda
    const rawStore = String(s.store || '').trim();
    const date = (s.date || '').trim();
    if (!rawStore || !date) return;

    const store = normalizeKeyStr(rawStore);
    const startMin = normalizeShiftStartMin(s);
    const key = `${date}__${store}__${startMin}`;

    if (!groups[key]) {
      groups[key] = {
        date,
        store: rawStore,
        startMin,
        shifts: [],
        cancels: 0,
        reemplazos: 0,
        activeConfirmed: 0,
        noProgramado: 0,
        sinPiloto: 0,
        excluded: 0
      };
    }
    groups[key].shifts.push(s);

    const rawSt = String(s.status || '').trim();
    const st = rawSt.toLowerCase();

    // 1. Piloto Cancela
    const isPilotCancel = (
      st === 'piloto cancela' ||
      st === 'cancela piloto' ||
      st === 'piloto canceló' ||
      st === 'piloto cancelo'
    );

    // 2. Reemplazo (cubre un cancelado o turno vacante)
    const isReplacement = (st === 'reemplazo');

    // 3. Exclusiones: estados que NO entran en el balance de cobertura ni efectividad.
    //    - Tienda Cerrada: no hay operación, no se puede medir.
    //    - Cliente Cancela: causa externa, no responsabilidad del piloto ni de la operación.
    //    - Adicional Autorizado: turno extra autorizado puntualmente, no es un cupo de la malla base.
    //    - Adicional Cancela / Adicional Cancelado: cancelación de un adicional, no aplica a la malla.
    const isExcluded = (
      st === 'tienda cerrada' ||
      st === 'cliente cancela' ||
      st === 'adicional autorizado' ||
      st === 'adicional cancela' ||
      st === 'adicional cancelado'
    );

    // 4. No Programado
    const isNoProgramado = (st === 'no programado');

    // 5. Cupo sin piloto
    const hasPilot = Boolean(
      (s.pilot && String(s.pilot).trim() !== '' && String(s.pilot).trim() !== '—') ||
      (s.pilot_id && String(s.pilot_id).trim() !== '' && String(s.pilot_id).trim() !== '—') ||
      (s.phone && String(s.phone).trim() !== '' && String(s.phone).trim() !== '—')
    );
    const isSinPiloto = (!rawSt || (!hasPilot && !isPilotCancel && !isReplacement && !isExcluded && !isNoProgramado));

    if (isPilotCancel) {
      groups[key].cancels++;
    } else if (isReplacement) {
      groups[key].reemplazos++;
    } else if (isExcluded) {
      groups[key].excluded++;
    } else if (isNoProgramado) {
      groups[key].noProgramado++;
    } else if (isSinPiloto) {
      groups[key].sinPiloto++;
    } else {
      // Turnos activos de la malla base: Confirmado, Adicional, Adicional TaDa, Híbrido, etc.
      groups[key].activeConfirmed++;
    }
  });

  let totalSlotsRequired = 0;
  let totalSlotsCovered = 0;
  let totalSlotsMissing = 0;
  let totalUnmatchedCancels = 0;
  let totalReplacements = 0;
  let totalMatchedReplacements = 0;
  let totalRawCancels = 0;
  let totalNoProgramado = 0;
  let totalSinPiloto = 0;
  let totalExcluded = 0;

  Object.values(groups).forEach(g => {
    totalRawCancels += g.cancels;
    totalReplacements += g.reemplazos;
    totalNoProgramado += g.noProgramado;
    totalSinPiloto += g.sinPiloto;
    totalExcluded += g.excluded;

    const matched = Math.min(g.cancels, g.reemplazos);
    const unmatched = Math.max(0, g.cancels - g.reemplazos);

    totalMatchedReplacements += matched;
    totalUnmatchedCancels += unmatched;

    // Turnos cubiertos en este grupo horario:
    // Activos normales + todos los reemplazos (que cubren cancelados o slots requeridos)
    const groupCovered = g.activeConfirmed + g.reemplazos;

    // Turnos faltantes en este grupo horario:
    // Cancelaciones sin reemplazo + no programados + vacantes sin piloto
    const groupMissing = unmatched + g.noProgramado + g.sinPiloto;

    // Turnos totales requeridos:
    const groupRequired = groupCovered + groupMissing;

    totalSlotsCovered += groupCovered;
    totalSlotsMissing += groupMissing;
    totalSlotsRequired += groupRequired;
  });

  const cuposCoveragePct = totalSlotsRequired > 0
    ? (totalSlotsCovered / totalSlotsRequired) * 100
    : 100;

  return {
    groupsCount: Object.keys(groups).length,
    totalSlotsRequired,
    totalSlotsCovered,
    totalSlotsMissing,
    totalUnmatchedCancels,
    totalReplacements,
    totalMatchedReplacements,
    totalRawCancels,
    totalNoProgramado,
    totalSinPiloto,
    totalExcluded,
    cuposCoveragePct,
    effectivenessPct: cuposCoveragePct,
    groups
  };
}

/**
 * REESTRUCTURACIÓN DE TARJETAS KPI (EXCLUSIVAS DEL MÓDULO 1)
 * Calcula exactamente las 9 métricas especificadas por la normativa operativa.
 */
function calculateModulo1Kpis(shifts, config = (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : DEFAULT_CONFIG)) {
  const totalFiltered = shifts.length;
  if (totalFiltered === 0) {
    return {
      asistenciaEffectivenessPct: null,
      asistenciaCoveredCount: 0,
      asistenciaRequiredCount: 0,
      cancellationRatePct: null,
      cancellationNetRatePct: null,
      penalizedCount: 0,
      penalizedBreakdown: { pilotCancel: 0, adicionalCancela: 0, noProgramado: 0, emptyStatus: 0, matchedReplacements: 0, unmatchedCancels: 0 },
      cuposCoveragePct: null,
      cuposCoveredCount: 0,
      cuposEvaluatedCount: 0,
      cuposExcludedCount: 0,
      cuposFaltantesTotal: 0,
      cuposFaltantesBreakdown: { unmatchedCancels: 0, noProgramado: 0, sinPiloto: 0, matchedReplacements: 0, rawCancels: 0 },
      punctualityPct: null,
      punctualCount: 0,
      punctualityEvaluatedCount: 0,
      activePilotsCount: 0,
      totalPackages: 0,
      totalManagedHours: 0,
      fleetProductivityPaqH: 0,
      avgAttendanceScale7: 0,
      avgAttendancePct: 0
    };
  }

  // 1. REGLA TRANSVERSAL DE MATCH & EFECTIVIDAD DE ASISTENCIA / COBERTURA
  const matchResult = reconcileShiftsMatch(shifts);

  // 2. TASA DE CANCELACIÓN
  let penalizedPilotCancel = 0;
  let penalizedAdicionalCancela = 0;
  let penalizedNoProgramado = 0;
  let penalizedEmpty = 0;

  // 5. PUNTUALIDAD CON GABELA
  let punctualityEvaluatedCount = 0;
  let punctualCount = 0;

  // 6. PILOTOS ACTIVOS (Únicos por ID o nombre)
  const uniquePilotsMap = new Map();

  // 7. PAQUETES ENTREGADOS
  let totalPaquetesEntregados = 0;

  shifts.forEach(s => {
    const rawSt = String(s.status || '').trim();
    const st = rawSt.toLowerCase();

    // Penalizados brutos
    if (st === 'piloto cancela' || st === 'cancela piloto' || st === 'piloto canceló' || st === 'piloto cancelo') {
      penalizedPilotCancel++;
    } else if (st === 'adicional cancela' || st === 'adicional cancelado') {
      penalizedAdicionalCancela++;
    } else if (st === 'no programado') {
      penalizedNoProgramado++;
    } else if (!rawSt) {
      penalizedEmpty++;
    }

    // Puntualidad con Gabela
    if (s.start != null && s.arrival != null && !isNaN(s.start) && !isNaN(s.arrival)) {
      punctualityEvaluatedCount++;
      if (isShiftPunctualWithGabela(s.start, s.arrival)) {
        punctualCount++;
      }
    }

    // Pilotos Activos y Asistencia
    const pilotId = (s.pilot_id && String(s.pilot_id).trim() !== '' && String(s.pilot_id).trim() !== '—')
      ? String(s.pilot_id).trim()
      : (s.pilot && String(s.pilot).trim() !== '' && String(s.pilot).trim() !== '—' ? String(s.pilot).trim() : null);

    if (pilotId) {
      if (!uniquePilotsMap.has(pilotId)) {
        uniquePilotsMap.set(pilotId, { id: pilotId, attended: 0, total: 0 });
      }
      const pEntry = uniquePilotsMap.get(pilotId);
      pEntry.total++;

      // Turnos en los que el piloto asistió físicamente (para Pilotos Activos y Promedio Asistencia).
      // Nota: 'adicional autorizado' y 'tienda cerrada' se excluyen del balance de cobertura/efectividad
      // (gestionado en reconcileShiftsMatch), pero el piloto sí asistió, así que sigue contando aquí.
      const isAttended = (
        st === 'confirmado' ||
        st === 'reemplazo' ||
        st === 'adicional' ||
        st === 'adicional autorizado' ||
        st === 'adicional tada' ||
        st === 'híbrido' ||
        st === 'hibrido' ||
        st === 'tienda cerrada' ||
        st === 'cliente cancela'
      );
      if (isAttended) {
        pEntry.attended++;
      }
    }

    // Paquetes
    const pkgsReal = Number(s.packages) || 0;
    const pkgsCanc = Number(s.packages_cancelled) || 0;
    totalPaquetesEntregados += (pkgsReal + pkgsCanc);
  });

  // Denominador para tasas de cancelación (sobre el universo de turnos activos del match)
  const totalBaseDenominator = matchResult.totalSlotsRequired > 0 ? matchResult.totalSlotsRequired : totalFiltered;
  const cancellationRatePct = (penalizedPilotCancel / totalBaseDenominator) * 100;
  const cancellationNetRatePct = (matchResult.totalUnmatchedCancels / totalBaseDenominator) * 100;

  // ── COBERTURA DE CUPOS (Fórmula oficial validada) ─────────────────────────────────────────
  //
  // CASO DE PRUEBA → Cra 91, Semana 38:
  //   Turnos Requeridos = 28  |  Reemplazos = 8
  //   (28 + 8) / 28 × 100 = 128.57% ≈ 129% ✓
  //
  // Fórmula:
  //   Numerador   = Turnos Requeridos + Pilotos de Reemplazo
  //                 → total de recursos desplegados: demanda base + refuerzo adicional
  //   Denominador = Turnos Requeridos
  //                 → cupos/turnos planificados originalmente (del match, sin filas de reemplazo)
  //
  // Puede superar el 100% cuando los reemplazos superan la demanda base (cobertura en exceso).
  const cuposTurnRequeridos  = Math.max(1, matchResult.totalSlotsRequired);    // demanda base del match
  const cuposCoveredNumerator = cuposTurnRequeridos + matchResult.totalReplacements; // requeridos + refuerzos
  const cuposMallaBase        = cuposTurnRequeridos;                            // denominador = demanda base
  const cuposCoveragePctNew   = (cuposCoveredNumerator / cuposMallaBase) * 100;

  const punctualityPct = punctualityEvaluatedCount > 0
    ? (punctualCount / punctualityEvaluatedCount) * 100
    : null;

  const activePilotsCount = uniquePilotsMap.size;

  const totalManagedHours = totalBaseDenominator * 8;
  const fleetProductivityPaqH = totalManagedHours > 0
    ? (totalPaquetesEntregados / totalManagedHours)
    : 0;

  // Promedio de Asistencia (Escala 1 a 7)
  let sumPilotRates = 0;
  uniquePilotsMap.forEach(p => {
    const rate = p.total > 0 ? (p.attended / p.total) : 0;
    sumPilotRates += rate;
  });
  const avgFleetAttendance = activePilotsCount > 0 ? (sumPilotRates / activePilotsCount) : 0;
  const avgAttendanceScale7 = avgFleetAttendance * 7;

  return {
    asistenciaEffectivenessPct: matchResult.cuposCoveragePct,
    asistenciaCoveredCount: matchResult.totalSlotsCovered,
    asistenciaRequiredCount: matchResult.totalSlotsRequired,
    cancellationRatePct,
    cancellationNetRatePct,
    penalizedCount: penalizedPilotCancel + penalizedAdicionalCancela + penalizedNoProgramado,
    penalizedBreakdown: {
      pilotCancel: penalizedPilotCancel,
      adicionalCancela: penalizedAdicionalCancela,
      noProgramado: penalizedNoProgramado,
      emptyStatus: penalizedEmpty,
      matchedReplacements: matchResult.totalMatchedReplacements,
      unmatchedCancels: matchResult.totalUnmatchedCancels
    },
    cuposCoveragePct: cuposCoveragePctNew,            // (Requeridos + Reemplazos) / Requeridos × 100
    cuposCoveredCount: cuposCoveredNumerator,          // Requeridos + Reemplazos (numerador)
    cuposEvaluatedCount: cuposMallaBase,               // Turnos Requeridos (denominador = demanda base)
    cuposExcludedCount: matchResult.totalExcluded,
    cuposFaltantesTotal: matchResult.totalSlotsMissing,
    cuposFaltantesBreakdown: {
      unmatchedCancels: matchResult.totalUnmatchedCancels,
      noProgramado: matchResult.totalNoProgramado,
      sinPiloto: matchResult.totalSinPiloto,
      matchedReplacements: matchResult.totalMatchedReplacements,
      rawCancels: matchResult.totalRawCancels
    },
    punctualityPct,
    punctualCount,
    punctualityEvaluatedCount,
    activePilotsCount,
    totalPackages: totalPaquetesEntregados,
    totalManagedHours,
    fleetProductivityPaqH,
    avgAttendanceScale7,
    avgAttendancePct: avgFleetAttendance * 100
  };
}

/**
 * Agrega métricas para un conjunto de filas (turnos) según las fórmulas oficiales.
 */
function aggregateShiftMetrics(rows, config = APP_CONFIG) {
  const totalShifts = rows.length;
  const evaluable = rows.filter(r => r.evaluable);
  const attended = evaluable.filter(r => r.attended);
  const pilotCancels = evaluable.filter(r => r.pilot_cancel || r.pilotCancel);
  const excluded = rows.filter(r => r.excluded);

  const tolerance = config.punctualityToleranceMinutes || 0;
  const withArrival = attended.filter(r => r.start != null && r.arrival != null);
  const punctualShifts = withArrival.filter(r => {
    return Number(r.arrival) <= (Number(r.start) + tolerance);
  });

  const attendancePct = evaluable.length > 0
    ? (attended.length / evaluable.length) * 100
    : null;

  const cancellationPct = evaluable.length > 0
    ? (pilotCancels.length / evaluable.length) * 100
    : null;

  const punctualityPct = withArrival.length > 0
    ? (punctualShifts.length / withArrival.length) * 100
    : null;

  const totalPackages = attended.reduce((sum, r) => sum + (Number(r.packages) || 0), 0);
  const totalHours = attended.reduce((sum, r) => sum + (Number(r.hours) || 8), 0);
  const productivity = totalHours > 0 ? (totalPackages / totalHours) : null;

  // Metas de productividad esperadas
  const targets = attended.map(r => r.target_productivity).filter(t => t != null && !isNaN(t));
  const avgTarget = targets.length > 0
    ? targets.reduce((sum, t) => sum + Number(t), 0) / targets.length
    : null;

  const compliancePct = (productivity != null && avgTarget != null && avgTarget > 0)
    ? (productivity / (avgTarget / 8)) * 100
    : null;

  const lowDemandCount = rows.filter(r => r.low_demand).length;

  return {
    totalShifts,
    evaluableCount: evaluable.length,
    attendedCount: attended.length,
    pilotCancelCount: pilotCancels.length,
    excludedCount: excluded.length,
    withArrivalCount: withArrival.length,
    punctualCount: punctualShifts.length,
    attendancePct,
    cancellationPct,
    punctualityPct,
    totalPackages,
    totalHours,
    productivity,
    avgTarget,
    compliancePct,
    lowDemandCount
  };
}

/**
 * Calcula el Índice de Confiabilidad (0 a 100) para un piloto.
 */
function calculateReliabilityScore(metrics, config = APP_CONFIG) {
  if (!metrics || metrics.evaluableCount === 0) {
    return {
      score: null,
      subscores: {},
      badge: 'Sin turnos evaluables',
      level: 'none',
      badgeClass: 'pill-neutral',
      description: 'El piloto no cuenta con turnos evaluables en el período seleccionado.'
    };
  }

  const weights = config.weights || DEFAULT_CONFIG.weights;

  // 1. Subscore Productividad (0 - 100)
  let subProductivity = 80;
  if (metrics.compliancePct != null) {
    subProductivity = Math.min(100, Math.max(0, metrics.compliancePct));
  } else if (metrics.productivity != null) {
    subProductivity = Math.min(100, Math.max(0, (metrics.productivity / 2.5) * 100));
  }

  // 2. Subscore Asistencia (0 - 100)
  const subAttendance = metrics.attendancePct != null
    ? Math.min(100, Math.max(0, metrics.attendancePct))
    : 50;

  // 3. Subscore Cancelación (0 - 100, invertido)
  let subCancellation = 100;
  if (metrics.cancellationPct != null) {
    const c = metrics.cancellationPct;
    if (c === 0) subCancellation = 100;
    else if (c <= config.cancellationGreen) {
      subCancellation = 100 - (c / config.cancellationGreen) * 15;
    } else if (c <= config.cancellationYellow) {
      subCancellation = 85 - ((c - config.cancellationGreen) / (config.cancellationYellow - config.cancellationGreen)) * 35;
    } else {
      subCancellation = Math.max(0, 50 - ((c - config.cancellationYellow) / 15) * 50);
    }
  }

  // 4. Subscore Puntualidad (0 - 100)
  const subPunctuality = metrics.punctualityPct != null
    ? Math.min(100, Math.max(0, metrics.punctualityPct))
    : (metrics.attendedCount > 0 ? 90 : 50);

  // 5. Subscore SLA 35 (0 - 100)
  const subSla = 88;

  const totalWeight = (weights.productivity || 0) + (weights.attendance || 0) +
                      (weights.cancellation || 0) + (weights.punctuality || 0) + (weights.sla35 || 0);

  const rawScore = (
    subProductivity * (weights.productivity || 0) +
    subAttendance * (weights.attendance || 0) +
    subCancellation * (weights.cancellation || 0) +
    subPunctuality * (weights.punctuality || 0) +
    subSla * (weights.sla35 || 0)
  ) / (totalWeight || 100);

  const score = Math.round(rawScore * 10) / 10;
  const recommendation = getPilotRecommendation(score, metrics, config);

  return {
    score,
    subscores: {
      productivity: Math.round(subProductivity),
      attendance: Math.round(subAttendance),
      cancellation: Math.round(subCancellation),
      punctuality: Math.round(subPunctuality),
      sla: Math.round(subSla)
    },
    ...recommendation
  };
}

function getPilotRecommendation(score, metrics, config = APP_CONFIG) {
  const att = metrics.attendancePct ?? 0;
  const can = metrics.cancellationPct ?? 0;

  const isGreen = score >= (config.reliabilityScoreGreen || 85) &&
                  att >= (config.attendanceGreen || 95) &&
                  can <= (config.cancellationGreen || 5);

  const isRed = score < (config.reliabilityScoreYellow || 70) ||
                att < (config.attendanceYellow || 90) ||
                can > (config.cancellationYellow || 10);

  if (isGreen) {
    return {
      level: 'high',
      badge: '🟢 Alta Confiabilidad (Apto para Programar)',
      badgeShort: '🟢 Apto para Programar',
      badgeClass: 'pill-good',
      dotColor: '#10b981',
      description: 'Piloto con asistencia superior a 95%, baja cancelación (≤5%) y alta productividad observada. Prioridad 1 en programación.'
    };
  } else if (isRed) {
    return {
      level: 'low',
      badge: '🔴 Baja Confiabilidad (Riesgo Alto)',
      badgeShort: '🔴 Alto Riesgo',
      badgeClass: 'pill-bad',
      dotColor: '#ef4444',
      description: 'Piloto con cancelaciones recurrentes (>10%) o asistencia menor al 90%. No se recomienda programar sin previa justificación.'
    };
  } else {
    return {
      level: 'medium',
      badge: '🟡 Confiabilidad Media (Programar con Seguimiento)',
      badgeShort: '🟡 Con Seguimiento',
      badgeClass: 'pill-warn',
      dotColor: '#f59e0b',
      description: 'Piloto con cumplimiento aceptable pero con margen de mejora en puntualidad o productividad.'
    };
  }
}

// ============================================================
// MÓDULO DE RANKINGS DE FLOTA CRÍTICA / BAJO RENDIMIENTO
// Reglas oficiales:
// 1. Filtro mínimo de 2 turnos programados en el rango filtrado.
// 2. Ordenamiento: Mayor cantidad de cancelaciones -> Menor % de productividad (desempate).
// 3. Score combinado de riesgo (cancelación + baja productividad).
// ============================================================

const RankingFlotaCriticaEngine = {
  MIN_SHIFTS_REQUIRED: 2,

  /**
   * Extrae el resumen consolidado de cada piloto evaluable (mínimo 2 turnos)
   */
  getPilotsSummary(shifts) {
    const pilotMap = {};

    shifts.forEach(s => {
      const pilotName = (s.pilot || '').trim();
      const pilotId = (s.pilot_id || '').trim();
      const key = pilotName || pilotId;
      if (!key || key === '—' || key.toLowerCase() === 'sin piloto') return;

      if (!pilotMap[key]) {
        pilotMap[key] = {
          pilot: pilotName || key,
          pilot_id: pilotId || '—',
          phone: s.phone || '—',
          city: s.city || '—',
          stores: new Set(),
          shifts: []
        };
      }
      if (s.store) pilotMap[key].stores.add(s.store);
      pilotMap[key].shifts.push(s);
    });

    const pilotsList = [];

    Object.values(pilotMap).forEach(p => {
      const totalShifts = p.shifts.length;
      // Regla de Volumen Mínimo: al menos 2 turnos programados en el periodo filtrado
      if (totalShifts < this.MIN_SHIFTS_REQUIRED) return;

      // Conteo de cancelaciones
      const cancels = p.shifts.filter(s => {
        const rawSt = (s.status || '').toLowerCase().trim();
        return Boolean(s.pilot_cancel || rawSt === 'piloto cancela' || rawSt === 'cancela');
      }).length;

      // Turnos asistidos y paquetes
      const attendedShifts = p.shifts.filter(s => s.attended);
      const attendedCount = attendedShifts.length;
      const totalPackages = attendedShifts.reduce((sum, s) => sum + (Number(s.packages) || 0), 0);
      const totalHours = attendedShifts.reduce((sum, s) => sum + (Number(s.hours) || 8), 0);
      const prodPaqH = totalHours > 0 ? (totalPackages / totalHours) : 0;

      // Metas de productividad esperadas
      const targets = attendedShifts.map(s => Number(s.target_productivity)).filter(t => !isNaN(t) && t > 0);
      const avgTargetPaqH = targets.length > 0 ? (targets.reduce((a, b) => a + b, 0) / targets.length / 8) : 1.5;

      // % de Productividad vs Meta
      let prodPct = 0;
      if (avgTargetPaqH > 0 && prodPaqH > 0) {
        prodPct = (prodPaqH / avgTargetPaqH) * 100;
      } else if (attendedCount > 0 && prodPaqH === 0) {
        prodPct = 0;
      } else if (attendedCount === 0) {
        prodPct = 0;
      }

      // % Impacto de Cancelación
      const cancelImpactPct = totalShifts > 0 ? (cancels / totalShifts) * 100 : 0;

      // Score Combinado de Riesgo (0 a 100):
      // Mayor cancelación + Menor productividad = Mayor score de riesgo
      const cancelPenalty = Math.min(100, (cancelImpactPct * 0.7) + (cancels * 10));
      const prodPenalty = Math.max(0, 100 - prodPct);
      const riskScore = Math.min(100, Math.round((cancelPenalty * 0.65) + (prodPenalty * 0.35)));

      // Acción sugerida según severidad
      let suggestedAction = { label: '⚠️ Llamado de Atención', colorClass: 'badge-aceptable', actionCode: 'LLAMADO' };
      if (cancels >= 3 || cancelImpactPct >= 50) {
        suggestedAction = { label: '🚫 Bloqueo Preventivo', colorClass: 'badge-bajo', actionCode: 'BLOQUEO' };
      } else if (cancels >= 2 || cancelImpactPct >= 30) {
        suggestedAction = { label: '⚖️ Citación a Descargos', colorClass: 'badge-aceptable', actionCode: 'DESCARGOS' };
      }

      // Nivel de status
      let statusTag = { label: '🟡 En Observación', class: 'pill-warn' };
      if (cancels >= 2 || (cancels >= 1 && prodPct < 75)) {
        statusTag = { label: '🔴 Atención Inmediata', class: 'pill-bad' };
      } else if (cancels >= 1 || prodPct < 85) {
        statusTag = { label: '🟠 Alerta Operativa', class: 'pill-warn' };
      }

      pilotsList.push({
        pilot: p.pilot,
        pilot_id: p.pilot_id,
        phone: p.phone,
        city: p.city,
        stores: [...p.stores],
        storesLabel: [...p.stores].join(', ') || '—',
        totalShifts,
        cancels,
        attendedCount,
        totalPackages,
        totalHours,
        prodPaqH: +prodPaqH.toFixed(2),
        avgTargetPaqH: +avgTargetPaqH.toFixed(2),
        prodPct: +prodPct.toFixed(1),
        cancelImpactPct: +cancelImpactPct.toFixed(1),
        riskScore,
        suggestedAction,
        statusTag
      });
    });

    return pilotsList;
  },

  /**
   * Ordenador oficial según reglas de priorización y desempate:
   * 1. Mayor cantidad de cancelaciones
   * 2. Desempate: Menor % de productividad
   * 3. Desempate: Mayor % de impacto de cancelación
   */
  sortPilotsCritical(a, b) {
    if (b.cancels !== a.cancels) {
      return b.cancels - a.cancels;
    }
    if (a.prodPct !== b.prodPct) {
      return a.prodPct - b.prodPct;
    }
    if (b.cancelImpactPct !== a.cancelImpactPct) {
      return b.cancelImpactPct - a.cancelImpactPct;
    }
    return a.prodPaqH - b.prodPaqH;
  },

  /**
   * Componente 2: Escalafón Global Top 10 con Más Cancelaciones
   */
  getGlobalTop10Cancels(shifts) {
    const summary = this.getPilotsSummary(shifts);
    const withCancels = summary.filter(p => p.cancels > 0);
    withCancels.sort((a, b) => this.sortPilotsCritical(a, b));
    return withCancels.slice(0, 10);
  },

  /**
   * Componente 1: Top 5 Peores Pilotos por Tienda (PUNTO/Seller)
   */
  getTop5ByStore(shifts, targetStore) {
    if (!targetStore) return [];
    const storeShifts = shifts.filter(s => (s.store || '').toLowerCase() === targetStore.toLowerCase());
    const summary = this.getPilotsSummary(storeShifts);
    summary.sort((a, b) => this.sortPilotsCritical(a, b));
    return summary.slice(0, 5);
  },

  /**
   * Obtiene lista de tiendas con pilotos con cancelaciones o bajo rendimiento
   */
  getStoresList(shifts) {
    const stores = new Set();
    shifts.forEach(s => {
      if (s.store) stores.add(s.store);
    });
    return [...stores].sort();
  },

  /**
   * NUEVO: Top 3 Tiendas con mayor volumen y tasa de cancelaciones
   */
  getTop3StoresByCancels(shifts) {
    const storeMap = {};

    shifts.forEach(s => {
      const storeName = s.store || 'Sin Tienda';
      if (!storeMap[storeName]) {
        storeMap[storeName] = {
          store: storeName,
          city: s.city || '—',
          totalShifts: 0,
          cancels: 0,
          attended: 0,
          replacements: 0
        };
      }
      storeMap[storeName].totalShifts++;
      const rawSt = (s.status || '').toLowerCase().trim();
      const isCancel = Boolean(s.pilot_cancel || rawSt === 'piloto cancela' || rawSt === 'cancela');
      if (isCancel) storeMap[storeName].cancels++;
      if (s.attended) storeMap[storeName].attended++;
      if (rawSt === 'reemplazo') storeMap[storeName].replacements++;
    });

    // Enriquecer con cálculo de match (cubiertos con reemplazo vs sin reemplazo)
    if (typeof MatchEngine !== 'undefined') {
      const match = MatchEngine.calculateTurnoMatch(shifts);
      if (match && match.groups) {
        Object.values(match.groups).forEach(g => {
          const st = g.store || 'Sin Tienda';
          if (storeMap[st]) {
            const matched = Math.min(g.cancels, g.reemplazos);
            const unmatched = Math.max(0, g.cancels - g.reemplazos);
            storeMap[st].matchedCancels = (storeMap[st].matchedCancels || 0) + matched;
            storeMap[st].unmatchedCancels = (storeMap[st].unmatchedCancels || 0) + unmatched;
          }
        });
      }
    }

    const list = Object.values(storeMap).map(st => {
      const cancelRatePct = st.totalShifts > 0 ? (st.cancels / st.totalShifts) * 100 : 0;
      return {
        ...st,
        matchedCancels: st.matchedCancels || 0,
        unmatchedCancels: st.unmatchedCancels || 0,
        cancelRatePct: +cancelRatePct.toFixed(1)
      };
    });

    // Ordenar por más cancelaciones (descendente), desempate por mayor tasa %
    list.sort((a, b) => {
      if (b.cancels !== a.cancels) return b.cancels - a.cancels;
      return b.cancelRatePct - a.cancelRatePct;
    });

    return list.slice(0, 3);
  }
};
