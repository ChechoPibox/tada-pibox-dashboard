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
 * Normaliza y homologa cualquier nombre de día de la semana a su versión canónica oficial con tildes:
 * 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'.
 * Maneja fuentes sin tildes ('Miercoles', 'Sabado'), diferencias de mayúsculas/minúsculas,
 * espacios en blanco, días festivos ('Lunes Festivo') y distorsiones de codificación UTF-8.
 * Si raw no está presente, lo deduce a partir de la fecha (dateStr) al mediodía local.
 */
function canonicalizeWeekday(raw, dateStr) {
  if (raw) {
    const clean = String(raw).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (clean.startsWith('lu')) return 'Lunes';
    if (clean.startsWith('ma')) return 'Martes';
    if (clean.startsWith('mi')) return 'Miércoles';
    if (clean.startsWith('ju')) return 'Jueves';
    if (clean.startsWith('vi')) return 'Viernes';
    if (clean.startsWith('sa')) return 'Sábado';
    if (clean.startsWith('do')) return 'Domingo';
  }
  if (dateStr) {
    const dNoon = typeof parseDateToNoon === 'function' ? parseDateToNoon(dateStr) : null;
    if (dNoon && !isNaN(dNoon.getTime())) {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return dayNames[dNoon.getDay()];
    }
  }
  return '';
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

  // Estado Cliente Cancela:
  // Para la Ficha individual del Piloto no se penaliza su score personal,
  // pero porta la marca clientCancel: true para la conciliación operativa transversal de la Tarjeta 2 y Módulo 2.
  if (
    s === 'cliente cancela' ||
    s === 'cancela cliente' ||
    s === 'cliente canceló' ||
    s === 'cliente cancelo' ||
    (s.includes('cliente') && s.includes('cancel'))
  ) {
    return {
      status: rawStatus,
      evaluable: false,
      attended: false,
      pilotCancel: false,
      clientCancel: true,
      excluded: false,
      category: 'CLIENTE_CANCELA'
    };
  }

  // Estados excluidos expresos según normativa operativa:
  // - Tienda cerrada (establecimiento sin operación)
  // - Adicional no autorizado (turno extra sin autorización)
  // - Adicional cancelado / No programado
  // No penalizan la asistencia, no afectan cancelaciones del piloto ni perjudican su score.
  if (
    s.includes('tienda cerrada') ||
    s === 'cerrada' ||
    s.includes('adicional no autoriz') ||
    s.includes('no autorizado') ||
    s.includes('adicional cancel') ||
    s.includes('no programado')
  ) {
    return {
      status: rawStatus,
      evaluable: false,
      attended: false,
      pilotCancel: false,
      clientCancel: false,
      excluded: true,
      category: 'EXCLUIDO'
    };
  }

  // Estados cancelados por piloto (atribuibles directamente al conductor)
  if (
    s === 'piloto cancela' ||
    s === 'cancela piloto' ||
    s === 'piloto canceló' ||
    s === 'piloto cancelo' ||
    (s.includes('piloto') && s.includes('cancel'))
  ) {
    return {
      status: rawStatus,
      evaluable: true,
      attended: false,
      pilotCancel: true,
      excluded: false,
      category: 'PILOTO_CANCELA'
    };
  }

  // Registros sin causal suficientemente clara o no reconocidos:
  // Según normativa oficial: no clasificar automáticamente como falta atribuible al piloto.
  // Se marcan como excluidos de penalización directa para evitar castigos injustificados.
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
 * Función canónica universal para verificar si un turno debe ser excluido
 * del denominador de efectividad, cobertura y cancelaciones operativas.
 */
function isOperationalShiftExcluded(rawStatus) {
  const s = String(rawStatus || '').trim().toLowerCase();
  if (!s) return false;
  return (
    s.includes('tienda cerrada') ||
    s === 'cerrada' ||
    s.includes('cliente cancela') ||
    s.includes('cancela cliente') ||
    s.includes('cliente canceló') ||
    s.includes('cliente cancelo') ||
    (s.includes('cliente') && s.includes('cancel')) ||
    s.includes('adicional no autoriz') ||
    s.includes('no autorizado') ||
    s === 'adicional autorizado' ||
    s.includes('adicional cancel') ||
    s.includes('no programado')
  );
}

/**
 * Función canónica universal para verificar si una cancelación es
 * imputable directamente al piloto conductor.
 */
function isOperationalPilotCancel(shift) {
  if (!shift) return false;
  if (shift.pilot_cancel) return true;
  const s = String(shift.status || '').trim().toLowerCase();
  return (
    s === 'piloto cancela' ||
    s === 'cancela piloto' ||
    s === 'piloto canceló' ||
    s === 'piloto cancelo' ||
    (s.includes('piloto') && s.includes('cancel'))
  );
}

if (typeof window !== 'undefined') {
  window.isOperationalShiftExcluded = isOperationalShiftExcluded;
  window.isOperationalPilotCancel = isOperationalPilotCancel;
}
if (typeof global !== 'undefined') {
  global.isOperationalShiftExcluded = isOperationalShiftExcluded;
  global.isOperationalPilotCancel = isOperationalPilotCancel;
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

let _productivityTargetIndex = null;
let _productivityTargetIndexLen = -1;

function _getProductivityTargetIndex() {
  if (typeof PRODUCTIVITY_TARGETS === 'undefined' || !PRODUCTIVITY_TARGETS.length) return null;
  if (_productivityTargetIndex && _productivityTargetIndexLen === PRODUCTIVITY_TARGETS.length) {
    return _productivityTargetIndex;
  }
  const idx = new Map();
  for (let i = 0; i < PRODUCTIVITY_TARGETS.length; i++) {
    const m = PRODUCTIVITY_TARGETS[i];
    if (m.target_packages == null) continue;
    const key = normalizeKeyStr(m.store);
    if (!idx.has(key)) idx.set(key, []);
    idx.get(key).push(m);
  }
  _productivityTargetIndex = idx;
  _productivityTargetIndexLen = PRODUCTIVITY_TARGETS.length;
  return idx;
}

/**
 * Realiza una coincidencia exacta de datos (Match) cruzando la hoja de productividad
 * mediante la clave compuesta: [PUNTO + DÍA DE LA SEMANA + INICIO DE TURNO]
 *
 * Retorna el valor PROM. PAQ (meta esperada)
 */
function findProductivityTargetExact(store, weekday, startMinutes) {
  const idx = _getProductivityTargetIndex();
  if (!idx || !store) return null;

  const nStore = normalizeKeyStr(store);
  const nDay = normalizeKeyStr(weekday);

  // Recolectar candidatos: O(1) por clave exacta, o búsqueda sobre claves únicas de tienda
  let storeCandidates = idx.get(nStore);
  if (!storeCandidates) {
    storeCandidates = [];
    for (const [k, entries] of idx.entries()) {
      if (nStore.includes(k) || k.includes(nStore)) {
        for (let i = 0; i < entries.length; i++) storeCandidates.push(entries[i]);
      }
    }
  }
  if (!storeCandidates.length) return null;

  // 1. Coincidencia exacta con tolerancia de inicio de turno (+/- 30 min)
  if (nDay && startMinutes != null) {
    const match = storeCandidates.find(m =>
      normalizeKeyStr(m.weekday) === nDay &&
      m.start_minutes != null &&
      Math.abs(m.start_minutes - startMinutes) <= 30
    );
    if (match) return match.target_packages;
  }

  // 2. Coincidencia por Punto + Día
  if (nDay) {
    const dayMatches = storeCandidates.filter(m => normalizeKeyStr(m.weekday) === nDay);
    if (dayMatches.length > 0) {
      const sum = dayMatches.reduce((acc, m) => acc + m.target_packages, 0);
      return Math.round((sum / dayMatches.length) * 10) / 10;
    }
  }

  // 3. Promedio histórico de la tienda
  const sum = storeCandidates.reduce((acc, m) => acc + m.target_packages, 0);
  return Math.round((sum / storeCandidates.length) * 10) / 10;
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
        pilotCancels: 0,
        clientCancels: 0,
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
      st === 'piloto cancelo' ||
      (st.includes('piloto') && st.includes('cancel'))
    );

    // 2. Cliente Cancela (debe tener match con reemplazo para no generar vacante en la operación)
    const isClientCancel = (
      st === 'cliente cancela' ||
      st === 'cancela cliente' ||
      st === 'cliente canceló' ||
      st === 'cliente cancelo' ||
      (st.includes('cliente') && st.includes('cancel'))
    );

    // 3. Reemplazo (cubre un cancelado o turno vacante)
    const isReplacement = (st === 'reemplazo');

    // 4. Exclusiones: estados que NO entran en el balance de cobertura ni efectividad.
    //    - Tienda Cerrada: no hay operación, no se puede medir.
    //    - Adicional No Autorizado: turno extra no autorizado.
    //    - Adicional Autorizado: turno extra autorizado puntualmente, no es un cupo de la malla base.
    //    - Adicional Cancela / Adicional Cancelado: cancelación de un adicional, no aplica a la malla base.
    const isExcluded = (
      st.includes('tienda cerrada') ||
      st === 'cerrada' ||
      st.includes('adicional no autoriz') ||
      st.includes('no autorizado') ||
      st === 'adicional autorizado' ||
      st === 'adicional cancela' ||
      st === 'adicional cancelado'
    );

    // 5. No Programado
    const isNoProgramado = (st === 'no programado');

    // 6. Cupo sin piloto / Vacante
    const pName = String(s.pilot || '').trim().toLowerCase();
    const hasPilot = Boolean(
      (s.pilot && pName !== '' && pName !== '—' && pName !== '[sin asignar]' && pName !== 'sin asignar' && pName !== 'sin piloto') ||
      (s.pilot_id && String(s.pilot_id).trim() !== '' && String(s.pilot_id).trim() !== '—') ||
      (s.phone && String(s.phone).trim() !== '' && String(s.phone).trim() !== '—')
    );
    const isSinPiloto = Boolean(
      s.is_vacant ||
      st === 'cupo faltante' ||
      st === 'sin piloto' ||
      st === 'vacante' ||
      !rawSt ||
      (!hasPilot && !isPilotCancel && !isClientCancel && !isReplacement && !isExcluded && !isNoProgramado)
    );

    if (isPilotCancel) {
      groups[key].pilotCancels++;
      groups[key].cancels++;
    } else if (isClientCancel) {
      groups[key].clientCancels++;
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
  let totalPilotCancels = 0;
  let totalClientCancels = 0;
  let totalMatchedPilotCancels = 0;
  let totalMatchedClientCancels = 0;
  let totalUnmatchedPilotCancels = 0;
  let totalUnmatchedClientCancels = 0;
  let totalNoProgramado = 0;
  let totalSinPiloto = 0;
  let totalExcluded = 0;

  // CONCILIACIÓN ESTRICTA 1 A 1:
  // El reemplazo DEBE coincidir exactamente en la misma Fecha, Tienda y Hora de Inicio del turno cancelado.
  Object.values(groups).forEach(g => {
    totalRawCancels += g.cancels;
    totalPilotCancels += (g.pilotCancels || 0);
    totalClientCancels += (g.clientCancels || 0);
    totalReplacements += g.reemplazos;
    totalNoProgramado += g.noProgramado;
    totalSinPiloto += g.sinPiloto;
    totalExcluded += g.excluded;

    const matched = Math.min(g.cancels, g.reemplazos);
    const unmatched = Math.max(0, g.cancels - g.reemplazos);

    totalMatchedReplacements += matched;
    totalUnmatchedCancels += unmatched;

    // Distribuir el match entre cancelaciones de piloto y de cliente
    let rem = g.reemplazos;
    const mPilot = Math.min(g.pilotCancels || 0, rem);
    rem -= mPilot;
    const mClient = Math.min(g.clientCancels || 0, rem);

    totalMatchedPilotCancels += mPilot;
    totalMatchedClientCancels += mClient;
    totalUnmatchedPilotCancels += ((g.pilotCancels || 0) - mPilot);
    totalUnmatchedClientCancels += ((g.clientCancels || 0) - mClient);

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

  // Detección proactiva de desajustes horarios:
  // Cancelaciones que tienen reemplazo confirmado en la misma tienda y fecha pero con hora de inicio desfasada
  const shiftMismatches = [];
  const storeDateBuckets = {};

  Object.values(groups).forEach(g => {
    const normSt = normalizeKeyStr(g.store);
    const sdKey = g.date + '__' + normSt;
    if (!storeDateBuckets[sdKey]) {
      storeDateBuckets[sdKey] = { unmatchedGroups: [], surplusGroups: [] };
    }
    const unmatched = Math.max(0, g.cancels - g.reemplazos);
    const surplus = Math.max(0, g.reemplazos - g.cancels);
    if (unmatched > 0) storeDateBuckets[sdKey].unmatchedGroups.push(g);
    if (surplus > 0) storeDateBuckets[sdKey].surplusGroups.push(g);
  });

  Object.values(storeDateBuckets).forEach(bucket => {
    if (bucket.unmatchedGroups.length > 0 && bucket.surplusGroups.length > 0) {
      bucket.unmatchedGroups.forEach(u => {
        bucket.surplusGroups.forEach(s => {
          const uTimeStr = typeof fmtMinutes === 'function' ? fmtMinutes(u.startMin) : `${u.startMin}`;
          const sTimeStr = typeof fmtMinutes === 'function' ? fmtMinutes(s.startMin) : `${s.startMin}`;
          shiftMismatches.push({
            date: u.date,
            store: u.store,
            cancelStartMin: u.startMin,
            repStartMin: s.startMin,
            cancelStartStr: uTimeStr,
            repStartStr: sTimeStr,
            diffMinutes: Math.abs(u.startMin - s.startMin),
            msg: `Desajuste horario en ${u.store} (${u.date}): cancelación a las ${uTimeStr} y reemplazo a las ${sTimeStr}. No se emparejan por diferencia de franja horaria.`
          });
        });
      });
    }
  });

  return {
    groupsCount: Object.keys(groups).length,
    totalSlotsRequired,
    totalSlotsCovered,
    totalSlotsMissing,
    totalUnmatchedCancels,
    totalReplacements,
    totalMatchedReplacements,
    totalRawCancels,
    totalPilotCancels,
    totalClientCancels,
    totalMatchedPilotCancels,
    totalMatchedClientCancels,
    totalUnmatchedPilotCancels,
    totalUnmatchedClientCancels,
    totalNoProgramado,
    totalSinPiloto,
    totalExcluded,
    cuposCoveragePct,
    effectivenessPct: cuposCoveragePct,
    shiftMismatches,
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
      cuposNumeratorCount: 0,
      cuposDenominatorCount: 0,
      cuposBreakdown: {
        confirmados: 0,
        reemplazo: 0,
        adicionalTaDa: 0,
        adicionalAutorizados: 0,
        tiendaCerrada: 0,
        pilotoCancela: 0,
        clienteCancela: 0,
        adicionalCancela: 0,
        adicionalNoAutorizado: 0,
        numerador: 0,
        denominador: 0
      },
      cuposExcludedCount: 0,
      cuposFaltantesTotal: 0,
      cuposFaltantesBreakdown: { unmatchedCancels: 0, noProgramado: 0, sinPiloto: 0, matchedReplacements: 0, rawCancels: 0 },
      punctualityPct: null,
      punctualCount: 0,
      punctualityEvaluatedCount: 0,
      activePilotsCount: 0,
      validManagedShiftsCount: 0,
      totalPackages: 0,
      totalManagedHours: 0,
      fleetProductivityPaqH: 0,
      packagesRealSum: 0,
      packagesCancSum: 0,
      asistenciaProgDistribution: {
        totalValidShifts: 0,
        totalPilots: 0,
        avgShiftsPerPilot: 0,
        cat1Pilots: 0, cat1Shifts: 0, cat1Pct: 0,
        cat2Pilots: 0, cat2Shifts: 0, cat2Pct: 0,
        cat3Pilots: 0, cat3Shifts: 0, cat3Pct: 0
      },
      avgAttendanceScale7: 0,
      avgAttendancePct: 0
    };
  }

  // 1. REGLA TRANSVERSAL DE MATCH & EFECTIVIDAD DE ASISTENCIA / COBERTURA
  const matchResult = reconcileShiftsMatch(shifts);

  // 2. TASA DE CANCELACIÓN (Validación de Piloto Cancela + Cliente Cancela con Match de Reemplazo)
  let penalizedPilotCancel = 0;
  let penalizedClientCancel = 0;
  let penalizedAdicionalCancela = 0;
  let penalizedNoProgramado = 0;
  let penalizedEmpty = 0;

  // 3. COBERTURA DE CUPOS (Fórmula oficial definida por estados para Tarjeta 3)
  // Numerador (8 estados): Confirmados, Reemplazo, Adicional TaDa, Adicional autorizados, Piloto Cancela, Cliente Cancela, Adicional Cancela, Tienda cerrada
  // Denominador (5 estados): Confirmados, Reemplazo, Adicional TaDa, Adicional autorizados, Tienda cerrada
  // Regla importante: "Adicional no autorizado" excluido completamente de numerador y denominador
  let cuposConfirmados = 0;
  let cuposReemplazo = 0;
  let cuposAdicionalTaDa = 0;
  let cuposAdicionalAutorizados = 0;
  let cuposTiendaCerrada = 0;
  let cuposPilotoCancela = 0;
  let cuposClienteCancela = 0;
  let cuposAdicionalCancela = 0;
  let cuposAdicionalNoAutorizado = 0;

  // 5. PUNTUALIDAD CON GABELA
  let punctualityEvaluatedCount = 0;
  let punctualCount = 0;

  // 6. PILOTOS ACTIVOS (Únicos por ID o nombre)
  const uniquePilotsMap = new Map();

  // 7 & 8. PAQUETES ENTREGADOS, HORAS GESTIONADAS Y PRODUCTIVIDAD DE FLOTA
  // Sumar Paquetería y Cancelados exclusivamente de los 4 estados válidos:
  // Confirmados, Reemplazo, Adicional TaDa, Adicional autorizados
  // Horas gestionadas = Total de turnos válidos × 8 horas
  let validManagedShiftsCount = 0;
  let totalPaquetesEntregados = 0;
  let totalPaquetesReal = 0;
  let totalPaquetesCanc = 0;

  // 9. CLASIFICACIÓN DE PILOTOS POR PROGRAMACIÓN SEMANAL (Tarjeta 9)
  // Estados válidos exclusivos: Confirmado, Reemplazo, Adicional TaDa, Adicional autorizado
  // Cada piloto clasificado una sola vez por cantidad de turnos válidos en el período
  const pilotValidAssistanceShiftsMap = new Map();
  let validAssistanceShiftsTotal = 0;

  shifts.forEach(s => {
    const rawSt = String(s.status || '').trim();
    const st = rawSt.toLowerCase();

    // Identificación canónica y normalizada del piloto (por ID o nombre)
    const rawPilotId = s.pilot_id ? String(s.pilot_id).trim() : '';
    const cleanPilotId = (rawPilotId && rawPilotId !== '—' && rawPilotId !== '-' && rawPilotId.toLowerCase() !== 'null' && rawPilotId.toLowerCase() !== 'undefined')
      ? rawPilotId.toLowerCase()
      : null;

    const rawPilotName = s.pilot ? String(s.pilot).trim() : '';
    const cleanPilotName = (rawPilotName && rawPilotName !== '—' && rawPilotName !== '-' && rawPilotName.toLowerCase() !== 'sin piloto')
      ? rawPilotName.toLowerCase()
      : null;

    const pilotKey = cleanPilotId || (cleanPilotName ? `NAME_${cleanPilotName}` : null);

    // Conteo de eventos de cancelación operativa
    if (st === 'piloto cancela' || st === 'cancela piloto' || st === 'piloto canceló' || st === 'piloto cancelo' || (st.includes('piloto') && st.includes('cancel'))) {
      penalizedPilotCancel++;
    } else if (st === 'cliente cancela' || st === 'cancela cliente' || st === 'cliente canceló' || st === 'cliente cancelo' || (st.includes('cliente') && st.includes('cancel'))) {
      penalizedClientCancel++;
    } else if (st === 'adicional cancela' || st === 'adicional cancelado') {
      penalizedAdicionalCancela++;
    } else if (st === 'no programado') {
      penalizedNoProgramado++;
    } else if (!rawSt) {
      penalizedEmpty++;
    }

    // Clasificación oficial para Cobertura de Cupos (Tarjeta 3)
    const isAdicNoAutorizado = (
      st.includes('adicional no autoriz') ||
      st.includes('no autorizado') ||
      st.includes('no autoriz')
    );

    if (isAdicNoAutorizado) {
      cuposAdicionalNoAutorizado++;
    } else {
      const isConf = (st === 'confirmado' || st === 'confirmados' || st === 'hibrido' || st === 'híbrido');
      const isReemp = (st === 'reemplazo' || st === 'reemplazos');
      const isAdicAut = (
        st === 'adicional autorizado' ||
        st === 'adicional autorizados' ||
        st === 'adicional autorizada' ||
        st === 'adicional autorizadas' ||
        (st.includes('adicional') && st.includes('autoriz'))
      );
      const isAdicCanc = (
        st === 'adicional cancela' ||
        st === 'adicional cancelado' ||
        st === 'adicional cancelada' ||
        (st.includes('adicional') && st.includes('cancel'))
      );
      const isAdicTaDa = !isAdicAut && !isAdicCanc && (
        st === 'adicional tada' ||
        st === 'adicional ta da' ||
        (st.includes('adicional') && st.includes('tada')) ||
        st === 'adicional'
      );
      const isTiendaCerr = (
        st.includes('tienda cerrada') ||
        st === 'cerrada' ||
        st === 'tienda cerrada'
      );
      const isPilotoCanc = !isAdicCanc && (
        st === 'piloto cancela' ||
        st === 'cancela piloto' ||
        st === 'piloto canceló' ||
        st === 'piloto cancelo' ||
        (st.includes('piloto') && st.includes('cancel'))
      );
      const isClienteCanc = !isAdicCanc && (
        st === 'cliente cancela' ||
        st === 'cancela cliente' ||
        st === 'cliente canceló' ||
        st === 'cliente cancelo' ||
        (st.includes('cliente') && st.includes('cancel'))
      );

      if (isConf) {
        cuposConfirmados++;
      } else if (isReemp) {
        cuposReemplazo++;
      } else if (isAdicAut) {
        cuposAdicionalAutorizados++;
      } else if (isAdicCanc) {
        cuposAdicionalCancela++;
      } else if (isAdicTaDa) {
        cuposAdicionalTaDa++;
      } else if (isTiendaCerr) {
        cuposTiendaCerrada++;
      } else if (isPilotoCanc) {
        cuposPilotoCancela++;
      } else if (isClienteCanc) {
        cuposClienteCancela++;
      }

      // ── Tarjetas 7 y 8: Conteo exclusivo sobre los 4 estados válidos ──
      const isManagedProductiveShift = (isConf || isReemp || isAdicAut || isAdicTaDa);
      if (isManagedProductiveShift) {
        validManagedShiftsCount++;
        const pkgsReal = Number(s.packages) || Number(s.paquetes) || 0;
        const pkgsCanc = Number(s.packages_cancelled) || Number(s.cancelled_packages) || Number(s.cancelled) || 0;
        totalPaquetesReal += pkgsReal;
        totalPaquetesCanc += pkgsCanc;
        totalPaquetesEntregados += (pkgsReal + pkgsCanc);

        // ── Tarjeta 9: Agrupación de turnos válidos por piloto único ──
        validAssistanceShiftsTotal++;
        if (pilotKey) {
          pilotValidAssistanceShiftsMap.set(pilotKey, (pilotValidAssistanceShiftsMap.get(pilotKey) || 0) + 1);
        }
      }
    }

    // Puntualidad con Gabela
    if (s.start != null && s.arrival != null && !isNaN(s.start) && !isNaN(s.arrival)) {
      punctualityEvaluatedCount++;
      if (isShiftPunctualWithGabela(s.start, s.arrival)) {
        punctualCount++;
      }
    }

    // 6. PILOTOS ACTIVOS (Conteo estricto de ID únicos en el período seleccionado)
    // Cada ID de piloto debe contabilizarse una sola vez dentro del período seleccionado,
    // normalizado para evitar duplicidades por mayúsculas/minúsculas o tiendas distintas.
    if (pilotKey) {
      if (!uniquePilotsMap.has(pilotKey)) {
        uniquePilotsMap.set(pilotKey, { id: cleanPilotId || rawPilotName, name: rawPilotName, attended: 0, total: 0 });
      }
      const pEntry = uniquePilotsMap.get(pilotKey);
      pEntry.total++;

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

  });

  // ── TASA DE CANCELACIÓN (Fórmula oficial según Contexto del Proyecto) ───────────────────────
  // Definición oficial: % Tasa de Cancelación = [Piloto Cancela / Evaluables] × 100
  // Turnos Evaluables = Cumplidos (Confirmado, Reemplazo, Adicional) + Piloto Cancela
  // EXCLUIR del numerador y denominador: Cliente Cancela, No Programado, Sin Piloto
  // Estos eventos NO son responsabilidad del piloto y no deben distorsionar su tasa.
  const attendedForCancellation = cuposConfirmados + cuposReemplazo + cuposAdicionalTaDa + cuposAdicionalAutorizados;
  const evaluableForCancellation = attendedForCancellation + penalizedPilotCancel;
  const cancellationRatePct = evaluableForCancellation > 0
    ? (penalizedPilotCancel / evaluableForCancellation) * 100
    : 0;

  // Tasa neta: cancelaciones que quedaron sin cobertura de reemplazo (para cuadre operativo de cupos)
  const totalBaseDenominator = matchResult.totalSlotsRequired > 0 ? matchResult.totalSlotsRequired : totalFiltered;
  const totalOperativeCancels = penalizedPilotCancel + penalizedClientCancel; // preservado para compatibilidad interna
  const cancellationNetRatePct = totalBaseDenominator > 0 ? (matchResult.totalUnmatchedCancels / totalBaseDenominator) * 100 : 0;

  // ── COBERTURA DE CUPOS (Fórmula oficial ajustada de Tarjeta 3) ─────────────────────────
  // Numerador (8 estados): Confirmados + Reemplazo + Adicional TaDa + Adicional autorizados + Piloto Cancela + Cliente Cancela + Adicional Cancela + Tienda cerrada
  // Denominador (5 estados): Confirmados + Reemplazo + Adicional TaDa + Adicional autorizados + Tienda cerrada
  // Regla importante: "Adicional no autorizado" excluido completamente tanto del numerador como del denominador.
  const cuposDenominador = cuposConfirmados + cuposReemplazo + cuposAdicionalTaDa + cuposAdicionalAutorizados + cuposTiendaCerrada;
  const cuposNumerador = cuposDenominador + cuposPilotoCancela + cuposClienteCancela + cuposAdicionalCancela;
  const cuposCoveragePctCalculated = cuposDenominador > 0 ? (cuposNumerador / cuposDenominador) * 100 : null;

  const punctualityPct = punctualityEvaluatedCount > 0
    ? (punctualCount / punctualityEvaluatedCount) * 100
    : null;

  const activePilotsCount = uniquePilotsMap.size;

  // ── HORAS GESTIONADAS Y PRODUCTIVIDAD DE FLOTA (Tarjetas 7 y 8) ─────────────────────────
  // Horas gestionadas = Total de turnos válidos (los 4 estados) × 8 horas
  // Productividad Flota = Volumen total de paquetería ÷ Horas gestionadas
  // Meta oficial conservada: ≥1.5 paq/h
  const totalManagedHours = validManagedShiftsCount * 8;
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

  // ── 9. CLASIFICACIÓN DE PILOTOS POR PROGRAMACIÓN SEMANAL (Tarjeta 9) ───────────────────
  let cat1Pilots = 0, cat1Shifts = 0;
  let cat2Pilots = 0, cat2Shifts = 0;
  let cat3Pilots = 0, cat3Shifts = 0;

  pilotValidAssistanceShiftsMap.forEach((count) => {
    if (count >= 1 && count <= 2) {
      cat1Pilots++;
      cat1Shifts += count;
    } else if (count >= 3 && count <= 4) {
      cat2Pilots++;
      cat2Shifts += count;
    } else if (count >= 5) {
      cat3Pilots++;
      cat3Shifts += count;
    }
  });

  const totalClassifiedPilots = cat1Pilots + cat2Pilots + cat3Pilots;
  const avgShiftsPerPilot = totalClassifiedPilots > 0 ? (validAssistanceShiftsTotal / totalClassifiedPilots) : 0;

  // 1. Cálculo dinámico de porcentajes sobre el total de pilotos clasificados (100%)
  // Garantiza que la suma de los porcentajes sea exactamente 100% mediante ajuste de residuos
  let cat1PilotsPct = 0;
  let cat2PilotsPct = 0;
  let cat3PilotsPct = 0;

  if (totalClassifiedPilots > 0) {
    let p1 = Math.round((cat1Pilots / totalClassifiedPilots) * 100);
    let p2 = Math.round((cat2Pilots / totalClassifiedPilots) * 100);
    let p3 = Math.round((cat3Pilots / totalClassifiedPilots) * 100);
    const sum = p1 + p2 + p3;
    const diff = 100 - sum;
    if (diff !== 0) {
      const remainders = [
        { key: 'p1', r: (cat1Pilots / totalClassifiedPilots) * 100 - Math.floor((cat1Pilots / totalClassifiedPilots) * 100) },
        { key: 'p2', r: (cat2Pilots / totalClassifiedPilots) * 100 - Math.floor((cat2Pilots / totalClassifiedPilots) * 100) },
        { key: 'p3', r: (cat3Pilots / totalClassifiedPilots) * 100 - Math.floor((cat3Pilots / totalClassifiedPilots) * 100) }
      ];
      if (diff > 0) {
        remainders.sort((a, b) => b.r - a.r);
        if (remainders[0].key === 'p1') p1 += diff;
        else if (remainders[0].key === 'p2') p2 += diff;
        else p3 += diff;
      } else {
        remainders.sort((a, b) => a.r - b.r);
        if (remainders[0].key === 'p1') p1 += diff;
        else if (remainders[0].key === 'p2') p2 += diff;
        else p3 += diff;
      }
    }
    cat1PilotsPct = p1;
    cat2PilotsPct = p2;
    cat3PilotsPct = p3;
  }

  // 2. Cálculo dinámico de porcentajes sobre el total de turnos válidos (100.0%)
  let cat1ShiftsPct = 0;
  let cat2ShiftsPct = 0;
  let cat3ShiftsPct = 0;

  if (validAssistanceShiftsTotal > 0) {
    const rawS1 = (cat1Shifts / validAssistanceShiftsTotal) * 100;
    const rawS2 = (cat2Shifts / validAssistanceShiftsTotal) * 100;
    const rawS3 = (cat3Shifts / validAssistanceShiftsTotal) * 100;

    let s1 = Math.round(rawS1 * 10) / 10;
    let s2 = Math.round(rawS2 * 10) / 10;
    let s3 = Math.round(rawS3 * 10) / 10;

    const sum10 = Math.round((s1 + s2 + s3) * 10);
    const diff10 = 1000 - sum10; // 100.0% * 10
    if (diff10 !== 0) {
      s3 = Math.round((s3 + diff10 / 10) * 10) / 10;
    }
    cat1ShiftsPct = s1;
    cat2ShiftsPct = s2;
    cat3ShiftsPct = s3;
  }

  const asistenciaProgDistribution = {
    totalValidShifts: validAssistanceShiftsTotal,
    totalPilots: totalClassifiedPilots,
    avgShiftsPerPilot,
    cat1Pilots, cat1Shifts, cat1Pct: cat1PilotsPct, cat1PilotsPct, cat1ShiftsPct,
    cat2Pilots, cat2Shifts, cat2Pct: cat2PilotsPct, cat2PilotsPct, cat2ShiftsPct,
    cat3Pilots, cat3Shifts, cat3Pct: cat3PilotsPct, cat3PilotsPct, cat3ShiftsPct
  };

  return {
    asistenciaEffectivenessPct: matchResult.cuposCoveragePct,
    asistenciaCoveredCount: matchResult.totalSlotsCovered,
    asistenciaRequiredCount: matchResult.totalSlotsRequired,
    cancellationRatePct,
    cancellationNetRatePct,
    penalizedCount: totalOperativeCancels + penalizedAdicionalCancela + penalizedNoProgramado,
    penalizedBreakdown: {
      pilotCancel: penalizedPilotCancel,
      clientCancel: penalizedClientCancel,
      totalCancels: totalOperativeCancels,
      adicionalCancela: penalizedAdicionalCancela,
      noProgramado: penalizedNoProgramado,
      emptyStatus: penalizedEmpty,
      matchedReplacements: matchResult.totalMatchedReplacements,
      unmatchedCancels: matchResult.totalUnmatchedCancels,
      matchedPilotCancels: matchResult.totalMatchedPilotCancels || 0,
      matchedClientCancels: matchResult.totalMatchedClientCancels || 0,
      unmatchedPilotCancels: matchResult.totalUnmatchedPilotCancels || 0,
      unmatchedClientCancels: matchResult.totalUnmatchedClientCancels || 0
    },
    cuposCoveragePct: cuposCoveragePctCalculated,
    cuposCoveredCount: cuposNumerador,
    cuposEvaluatedCount: cuposDenominador,
    cuposNumeratorCount: cuposNumerador,
    cuposDenominatorCount: cuposDenominador,
    cuposBreakdown: {
      confirmados: cuposConfirmados,
      reemplazo: cuposReemplazo,
      adicionalTaDa: cuposAdicionalTaDa,
      adicionalAutorizados: cuposAdicionalAutorizados,
      tiendaCerrada: cuposTiendaCerrada,
      pilotoCancela: cuposPilotoCancela,
      clienteCancela: cuposClienteCancela,
      adicionalCancela: cuposAdicionalCancela,
      adicionalNoAutorizado: cuposAdicionalNoAutorizado,
      numerador: cuposNumerador,
      denominador: cuposDenominador
    },
    cuposExcludedCount: matchResult.totalExcluded,
    cuposFaltantesTotal: matchResult.totalSlotsMissing,
    shiftMismatches: matchResult.shiftMismatches || [],
    cuposFaltantesBreakdown: {
      unmatchedCancels: matchResult.totalUnmatchedCancels,
      unmatchedPilotCancels: matchResult.totalUnmatchedPilotCancels || 0,
      unmatchedClientCancels: matchResult.totalUnmatchedClientCancels || 0,
      noProgramado: matchResult.totalNoProgramado,
      sinPiloto: matchResult.totalSinPiloto,
      matchedReplacements: matchResult.totalMatchedReplacements,
      rawCancels: matchResult.totalRawCancels,
      pilotCancels: matchResult.totalPilotCancels || 0,
      clientCancels: matchResult.totalClientCancels || 0
    },
    punctualityPct,
    punctualCount,
    punctualityEvaluatedCount,
    activePilotsCount,
    validManagedShiftsCount,
    totalPackages: totalPaquetesEntregados,
    totalManagedHours,
    fleetProductivityPaqH,
    packagesRealSum: totalPaquetesReal,
    packagesCancSum: totalPaquetesCanc,
    asistenciaProgDistribution,
    avgAttendanceScale7,
    avgAttendancePct: avgFleetAttendance * 100
  };
}

/**
 * Agrega métricas para un conjunto de filas (turnos) según las fórmulas oficiales.
 */
function aggregateShiftMetrics(rows, config = APP_CONFIG) {
  const totalShifts = rows ? rows.length : 0;
  const evaluable = (rows || []).filter(r => {
    if (r.evaluable !== undefined) return Boolean(r.evaluable);
    if (r.excluded === true) return false;
    if (r.attended === true || r.pilot_cancel === true || r.pilotCancel === true) return true;
    const cls = typeof classifyShiftStatus === 'function' ? classifyShiftStatus(r.status) : null;
    return cls ? cls.evaluable : false;
  });
  const attended = evaluable.filter(r => {
    if (r.attended !== undefined) return Boolean(r.attended);
    const cls = typeof classifyShiftStatus === 'function' ? classifyShiftStatus(r.status) : null;
    return cls ? cls.attended : false;
  });
  const pilotCancels = evaluable.filter(r => {
    if (r.pilot_cancel !== undefined) return Boolean(r.pilot_cancel);
    if (r.pilotCancel !== undefined) return Boolean(r.pilotCancel);
    const cls = typeof classifyShiftStatus === 'function' ? classifyShiftStatus(r.status) : null;
    return cls ? cls.pilotCancel : false;
  });
  const excluded = rows.filter(r => {
    if (r.excluded !== undefined) return Boolean(r.excluded);
    const cls = typeof classifyShiftStatus === 'function' ? classifyShiftStatus(r.status) : null;
    return cls ? cls.excluded : false;
  });

  const tolerance = config.punctualityToleranceMinutes || 0;
  const withArrival = attended.filter(r => r.start != null && r.arrival != null);
  const punctualShifts = withArrival.filter(r => {
    return isShiftPunctualWithGabela(r.start, r.arrival);
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

  // Cumplimiento real de SLA 35 (en turnos asistidos con entregas)
  const withSla = attended.filter(r => r.sla35 != null && !isNaN(r.sla35) && (Number(r.packages) || 0) > 0);
  const avgSla35 = withSla.length > 0
    ? (withSla.reduce((sum, r) => sum + Number(r.sla35), 0) / withSla.length) * 100
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
    avgSla35,
    lowDemandCount
  };
}

/**
 * Calcula el Índice de Confiabilidad (0 a 100) para un piloto.
 */
function calculateReliabilityScore(metrics, config = APP_CONFIG) {
  if (!metrics) {
    return {
      score: null,
      subscores: {},
      badge: 'Sin turnos evaluables',
      level: 'none',
      badgeClass: 'pill-neutral',
      description: 'Sin datos disponibles para evaluar.'
    };
  }

  // Si tiene turnos asistidos o cancelados, asegurar que evaluableCount no sea 0
  const realAttended = metrics.attendedCount || 0;
  const realCancels = metrics.pilotCancelCount || 0;
  const activeCount = realAttended + realCancels;
  const effectiveEvaluable = Math.max(metrics.evaluableCount || 0, activeCount);

  if (effectiveEvaluable === 0) {
    return {
      score: null,
      subscores: {},
      badge: 'Sin turnos evaluables',
      level: 'none',
      badgeClass: 'pill-neutral',
      description: metrics.totalShifts > 0
        ? 'El piloto solo registra turnos excluidos (tienda cerrada o cancelados por cliente).'
        : 'El piloto no cuenta con turnos registrados en la base de datos.'
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
  const attPct = metrics.attendancePct != null ? metrics.attendancePct : (effectiveEvaluable > 0 ? (realAttended / effectiveEvaluable) * 100 : 100);
  const subAttendance = Math.min(100, Math.max(0, attPct));

  // 3. Subscore Cancelación (0 - 100, invertido)
  let subCancellation = 100;
  const canPct = metrics.cancellationPct != null ? metrics.cancellationPct : (effectiveEvaluable > 0 ? (realCancels / effectiveEvaluable) * 100 : 0);
  if (canPct === 0) {
    subCancellation = 100;
  } else if (canPct <= config.cancellationGreen) {
    subCancellation = 100 - (canPct / config.cancellationGreen) * 15;
  } else if (canPct <= config.cancellationYellow) {
    subCancellation = 85 - ((canPct - config.cancellationGreen) / (config.cancellationYellow - config.cancellationGreen)) * 35;
  } else {
    subCancellation = Math.max(0, 50 - ((canPct - config.cancellationYellow) / 15) * 50);
  }

  // 4. Subscore Puntualidad (0 - 100)
  const subPunctuality = metrics.punctualityPct != null
    ? Math.min(100, Math.max(0, metrics.punctualityPct))
    : (metrics.attendedCount > 0 ? 90 : 50);

  // 5. Subscore SLA 35 (0 - 100): cálculo dinámico con datos reales de la operación
  let subSla = 85; // neutral si el piloto no ha registrado despachos con métrica SLA
  if (metrics.avgSla35 != null) {
    subSla = Math.min(100, Math.max(0, metrics.avgSla35));
  }

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
// 1. Filtro mínimo de 1 turno programado en el rango filtrado.
// 2. Ordenamiento: Mayor cantidad de cancelaciones -> Menor % de productividad (desempate).
// 3. Score combinado de riesgo (cancelación + baja productividad).
// ============================================================

const RankingFlotaCriticaEngine = {
  MIN_SHIFTS_REQUIRED: 1,

  /**
   * Extrae el resumen consolidado de cada piloto evaluable (mínimo 1 turno)
   */
  getPilotsSummary(shifts) {
    const pilotMap = {};

    shifts.forEach(s => {
      const pilotName = (s.pilot || '').trim();
      const rawPilotId = (s.pilot_id || '').trim();
      const cleanPilotId = (rawPilotId && rawPilotId !== '—' && rawPilotId !== '-' && rawPilotId.toLowerCase() !== 'null' && rawPilotId.toLowerCase() !== 'undefined') ? rawPilotId.toLowerCase() : '';
      const key = cleanPilotId ? `ID_${cleanPilotId}` : (pilotName.toLowerCase() || null);
      if (!key || key === '—' || key.toLowerCase() === 'sin piloto') return;

      if (!pilotMap[key]) {
        pilotMap[key] = {
          pilot: pilotName || rawPilotId || key,
          pilot_id: rawPilotId || '—',
          phone: (s.phone && s.phone !== '—') ? s.phone : '—',
          city: (s.city && s.city !== '—') ? s.city : '—',
          stores: new Set(),
          shifts: []
        };
      }
      if (s.store) pilotMap[key].stores.add(s.store);
      if (pilotMap[key].city === '—' && s.city && s.city !== '—') pilotMap[key].city = s.city;
      if (pilotMap[key].phone === '—' && s.phone && s.phone !== '—') pilotMap[key].phone = s.phone;
      if (pilotMap[key].pilot_id === '—' && rawPilotId && rawPilotId !== '—') pilotMap[key].pilot_id = rawPilotId;
      pilotMap[key].shifts.push(s);
    });

    const pilotsList = [];

    Object.values(pilotMap).forEach(p => {
      const totalShifts = p.shifts.length;
      // Regla de Volumen Mínimo: al menos 1 turno programado en el periodo filtrado
      if (totalShifts < this.MIN_SHIFTS_REQUIRED) return;

      // Conteo de cancelaciones atribuibles al piloto (excluyendo Tienda Cerrada, Adicional no autorizado, Cliente cancela, etc.)
      const cancels = p.shifts.filter(s => {
        const rawSt = (s.status || '').toLowerCase().trim();
        const isExcluded = (
          rawSt.includes('tienda cerrada') ||
          rawSt === 'cerrada' ||
          rawSt.includes('adicional no autoriz') ||
          rawSt.includes('no autorizado') ||
          rawSt.includes('cliente cancela') ||
          rawSt.includes('cancela cliente') ||
          rawSt.includes('adicional cancel') ||
          rawSt.includes('no programado')
        );
        if (isExcluded) return false;
        return Boolean(
          s.pilot_cancel ||
          rawSt === 'piloto cancela' ||
          rawSt === 'cancela piloto' ||
          rawSt === 'piloto canceló' ||
          rawSt === 'piloto cancelo' ||
          (rawSt.includes('piloto') && rawSt.includes('cancel'))
        );
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

      // % Impacto de Cancelación: calculado sobre el universo evaluable (excluyendo cliente cancela, tienda cerrada y adicional no autorizado)
      const evaluableShifts = p.shifts.filter(s => {
        const rawSt = (s.status || '').toLowerCase().trim();
        const isExcluded = (
          rawSt.includes('tienda cerrada') ||
          rawSt === 'cerrada' ||
          rawSt.includes('adicional no autoriz') ||
          rawSt.includes('no autorizado') ||
          rawSt.includes('cliente cancela') ||
          rawSt.includes('cancela cliente') ||
          rawSt.includes('adicional cancel') ||
          rawSt.includes('no programado')
        );
        return !isExcluded;
      });
      const evaluableCount = evaluableShifts.length > 0 ? evaluableShifts.length : totalShifts;
      const cancelImpactPct = evaluableCount > 0 ? (cancels / evaluableCount) * 100 : 0;

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
   * Componente 2: Escalafón Global de la Flota (Ranking Total de la Flota)
   * Ranking consolidado de toda la flota evaluada (mínimo 1 turno),
   * priorizando cancelaciones recurrentes y desempate por menor productividad.
   */
  getGlobalTop10Cancels(shifts) {
    const summary = this.getPilotsSummary(shifts);
    summary.sort((a, b) => this.sortPilotsCritical(a, b));
    return summary;
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
          city: (s.city && s.city !== '—') ? s.city : '',
          totalShifts: 0,
          cancels: 0,
          attended: 0,
          replacements: 0
        };
      } else if (!storeMap[storeName].city && s.city && s.city !== '—') {
        storeMap[storeName].city = s.city;
      }
      storeMap[storeName].totalShifts++;
      const rawSt = (s.status || '').toLowerCase().trim();
      const isExcluded = (
        rawSt.includes('tienda cerrada') ||
        rawSt === 'cerrada' ||
        rawSt.includes('adicional no autoriz') ||
        rawSt.includes('no autorizado') ||
        rawSt.includes('cliente cancela') ||
        rawSt.includes('cancela cliente') ||
        rawSt.includes('adicional cancel') ||
        rawSt.includes('no programado')
      );
      const isCancel = !isExcluded && Boolean(
        s.pilot_cancel ||
        rawSt === 'piloto cancela' ||
        rawSt === 'cancela piloto' ||
        rawSt === 'piloto canceló' ||
        rawSt === 'piloto cancelo' ||
        (rawSt.includes('piloto') && rawSt.includes('cancel'))
      );
      if (isCancel) storeMap[storeName].cancels++;
      if (s.attended) storeMap[storeName].attended++;
      if (rawSt === 'reemplazo') storeMap[storeName].replacements++;
    });

    // Enriquecer con cálculo de match (cubiertos con reemplazo vs sin reemplazo)
    if (typeof reconcileShiftsMatch === 'function') {
      const match = reconcileShiftsMatch(shifts);
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
        city: st.city || '—',
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


// ============================================================
// MÓDULO 3 — INTELIGENCIA OPERATIVA & ANALÍTICA AVANZADA (v101)
// Motores de Cobertura por Punto, Rankings Positivos y Feedback
// ============================================================

const Modulo3IntelligenceEngine = {

  /**
   * REQUERIMIENTO 2: Cobertura y Faltantes por Punto con Porcentaje de Reemplazos
   * Aplica match transversal riguroso y concilia:
   * - Solicitados (Turnos requeridos = Cubiertos + Faltantes)
   * - Confirmados (Cubiertos sin reemplazo)
   * - Cubiertos (Efectivamente operados)
   * - Faltantes (Cancelados sin reemplazo + no programado + sin piloto)
   * - Reemplazos (Cantidad y % sobre turnos cubiertos)
   */
  computeStoreCoverageStats(shifts) {
    if (!shifts || shifts.length === 0) return [];
    const storeMap = {};

    shifts.forEach(s => {
      const rawStore = String(s.store || '').trim();
      if (!rawStore) return;
      const city = s.city || '—';
      const key = city + '__' + rawStore;
      if (!storeMap[key]) {
        storeMap[key] = {
          store: rawStore,
          city: city,
          shifts: []
        };
      }
      storeMap[key].shifts.push(s);
    });

    const list = Object.values(storeMap).map(st => {
      const match = typeof reconcileShiftsMatch === 'function'
        ? reconcileShiftsMatch(st.shifts)
        : null;

      let requested = 0;
      let covered = 0;
      let missing = 0;
      let replacements = 0;
      let confirmed = 0;

      if (match && match.groups) {
        requested = match.totalSlotsRequired;
        covered = match.totalSlotsCovered;
        missing = match.totalSlotsMissing;
        replacements = match.totalReplacements;
        confirmed = Math.max(0, covered - replacements);
      } else {
        requested = st.shifts.length;
        covered = st.shifts.filter(s => s.attended).length;
        missing = Math.max(0, requested - covered);
        replacements = st.shifts.filter(s => String(s.status || '').toLowerCase() === 'reemplazo').length;
        confirmed = Math.max(0, covered - replacements);
      }

      const coveragePct = requested > 0 ? (covered / requested) * 100 : 100;
      const missingPct = requested > 0 ? (missing / requested) * 100 : 0;
      // % de reemplazos sobre turnos cubiertos (representación operativa de dependencia de suplentes)
      const replacementsPct = covered > 0 ? (replacements / covered) * 100 : 0;

      return {
        store: st.store,
        city: st.city,
        requested,
        confirmed,
        covered,
        missing,
        replacements,
        coveragePct: +coveragePct.toFixed(1),
        missingPct: +missingPct.toFixed(1),
        replacementsPct: +replacementsPct.toFixed(1)
      };
    });

    return list.sort((a, b) => (b.missing - a.missing) || (a.coveragePct - b.coveragePct) || (b.requested - a.requested));
  },

  /**
   * REQUERIMIENTO 4: TOP de Mejores Tiendas por Productividad
   * Medición justa proporcional a horas trabajadas (paq/h) y tasa de asistencia
   */
  computeStoreProductivityRanking(shifts, topN = 5) {
    if (!shifts || shifts.length === 0) return [];
    const storeMap = {};

    shifts.forEach(s => {
      const rawStore = String(s.store || '').trim();
      if (!rawStore) return;
      const city = s.city || '—';
      const key = city + '__' + rawStore;
      if (!storeMap[key]) {
        storeMap[key] = {
          store: rawStore,
          city: city,
          shifts: []
        };
      }
      storeMap[key].shifts.push(s);
    });

    const list = Object.values(storeMap).map(st => {
      const match = typeof reconcileShiftsMatch === 'function' ? reconcileShiftsMatch(st.shifts) : null;
      const requested = match ? match.totalSlotsRequired : st.shifts.length;
      const attendedShifts = st.shifts.filter(s => s.attended);
      const covered = attendedShifts.length;
      const packages = attendedShifts.reduce((acc, s) => acc + (Number(s.packages) || 0), 0);
      const hours = attendedShifts.reduce((acc, s) => acc + (Number(s.hours) || 8), 0);
      const prodPaqH = hours > 0 ? (packages / hours) : 0;
      const attendancePct = requested > 0 ? (covered / requested) * 100 : 0;

      return {
        store: st.store,
        city: st.city,
        packages,
        covered,
        hours,
        prodPaqH: +prodPaqH.toFixed(2),
        attendancePct: +attendancePct.toFixed(1)
      };
    }).filter(st => st.covered > 0);

    // Ordenar por productividad descendente, desempate por paquetes y asistencia
    list.sort((a, b) => (b.prodPaqH - a.prodPaqH) || (b.packages - a.packages) || (b.attendancePct - a.attendancePct));
    return list.slice(0, topN);
  },

  /**
   * REQUERIMIENTO 5: TOP de Mejores Pilotos (Productividad y Asistencia)
   * Filtra turnos incompletos o sin piloto y exige volumen mínimo razonable
   */
  computePilotsRankings(shifts, topN = 5, minShifts = 1) {
    if (!shifts || shifts.length === 0) return { topProd: [], topAtt: [] };
    const pilotMap = {};

    shifts.forEach(s => {
      const pilotName = (s.pilot || '').trim();
      const rawPilotId = (s.pilot_id || '').trim();
      const cleanPilotId = (rawPilotId && rawPilotId !== '—' && rawPilotId !== '-' && rawPilotId.toLowerCase() !== 'null' && rawPilotId.toLowerCase() !== 'undefined') ? rawPilotId.toLowerCase() : '';
      const key = cleanPilotId ? ('ID_' + cleanPilotId) : (pilotName.toLowerCase() || null);
      if (!key || key === '—' || key.toLowerCase() === 'sin piloto') return;

      if (!pilotMap[key]) {
        pilotMap[key] = {
          pilot: pilotName || rawPilotId || key,
          pilot_id: rawPilotId || '—',
          city: s.city || '—',
          store: s.store || '—',
          shifts: []
        };
      }
      if (pilotMap[key].city === '—' && s.city && s.city !== '—') pilotMap[key].city = s.city;
      if (pilotMap[key].store === '—' && s.store && s.store !== '—') pilotMap[key].store = s.store;
      pilotMap[key].shifts.push(s);
    });

    const pilots = Object.values(pilotMap).map(p => {
      const totalShifts = p.shifts.length;
      const attendedShifts = p.shifts.filter(s => s.attended);
      const attendedCount = attendedShifts.length;
      const packages = attendedShifts.reduce((acc, s) => acc + (Number(s.packages) || 0), 0);
      const hours = attendedShifts.reduce((acc, s) => acc + (Number(s.hours) || 8), 0);
      const prodPaqH = hours > 0 ? (packages / hours) : 0;

      // Cancelaciones imputables exclusivamente al piloto
      const pilotCancels = p.shifts.filter(s => !isOperationalShiftExcluded(s.status) && isOperationalPilotCancel(s)).length;

      const evaluableShifts = attendedCount + pilotCancels;
      const attendancePct = evaluableShifts > 0 ? (attendedCount / evaluableShifts) * 100 : 0;

      return {
        pilot: p.pilot,
        pilot_id: p.pilot_id,
        city: p.city,
        store: p.store,
        totalShifts,
        attendedCount,
        pilotCancels,
        evaluableShifts,
        packages,
        hours,
        prodPaqH: +prodPaqH.toFixed(2),
        attendancePct: +attendancePct.toFixed(1)
      };
    }).filter(p => p.totalShifts >= minShifts);

    const topProd = pilots.slice()
      .filter(p => p.attendedCount > 0 && p.prodPaqH > 0)
      .sort((a, b) => (b.prodPaqH - a.prodPaqH) || (b.packages - a.packages) || (b.attendancePct - a.attendancePct))
      .slice(0, topN);

    const topAtt = pilots.slice()
      .filter(p => p.evaluableShifts > 0)
      .sort((a, b) => (b.attendancePct - a.attendancePct) || (b.attendedCount - a.attendedCount) || (b.prodPaqH - a.prodPaqH))
      .slice(0, topN);

    return { topProd, topAtt };
  },

  /**
   * REQUERIMIENTO ALERTAS 1: TOP de Tiendas con Menor Productividad
   * Muestra las tiendas con menor productividad efectiva (paq/h)
   * Filtra tiendas con horas operativas trabajadas > 0
   */
  computeStoreLowestProductivityRanking(shifts, topN = 3) {
    if (!shifts || shifts.length === 0) return [];
    const storeMap = {};

    shifts.forEach(s => {
      const rawStore = String(s.store || '').trim();
      if (!rawStore) return;
      const city = s.city || '—';
      const key = city + '__' + rawStore;
      if (!storeMap[key]) {
        storeMap[key] = {
          store: rawStore,
          city: city,
          shifts: []
        };
      }
      storeMap[key].shifts.push(s);
    });

    const list = Object.values(storeMap).map(st => {
      const match = typeof reconcileShiftsMatch === 'function' ? reconcileShiftsMatch(st.shifts) : null;
      const requested = match ? match.totalSlotsRequired : st.shifts.length;
      const attendedShifts = st.shifts.filter(s => s.attended);
      const covered = attendedShifts.length;
      const packages = attendedShifts.reduce((acc, s) => acc + (Number(s.packages) || 0), 0);
      const hours = attendedShifts.reduce((acc, s) => acc + (Number(s.hours) || 8), 0);
      const prodPaqH = hours > 0 ? (packages / hours) : 0;
      const attendancePct = requested > 0 ? (covered / requested) * 100 : 0;

      return {
        store: st.store,
        city: st.city,
        packages,
        covered,
        hours,
        prodPaqH: +prodPaqH.toFixed(2),
        attendancePct: +attendancePct.toFixed(1)
      };
    }).filter(st => st.covered > 0 && st.hours > 0);

    // Ordenar por menor productividad (ascendente), desempate por menos paquetes
    list.sort((a, b) => (a.prodPaqH - b.prodPaqH) || (a.packages - b.packages) || (a.attendancePct - b.attendancePct));
    return list.slice(0, topN);
  },

  /**
   * REQUERIMIENTO ALERTAS 2 y 3: TOP de Pilotos con Menor Productividad y Peor Asistencia
   * Excluye muestras insuficientes y cancelaciones no imputables al piloto
   */
  computePilotsAlertRankings(shifts, topNProd = 3, topNAtt = 3) {
    if (!shifts || shifts.length === 0) return { lowestProd: [], worstAtt: [] };
    const pilotMap = {};

    shifts.forEach(s => {
      const pilotName = (s.pilot || '').trim();
      const rawPilotId = (s.pilot_id || '').trim();
      const cleanPilotId = (rawPilotId && rawPilotId !== '—' && rawPilotId !== '-' && rawPilotId.toLowerCase() !== 'null' && rawPilotId.toLowerCase() !== 'undefined') ? rawPilotId.toLowerCase() : '';
      const key = cleanPilotId ? ('ID_' + cleanPilotId) : (pilotName.toLowerCase() || null);
      if (!key || key === '—' || key.toLowerCase() === 'sin piloto') return;

      if (!pilotMap[key]) {
        pilotMap[key] = {
          pilot: pilotName || rawPilotId || key,
          pilot_id: rawPilotId || '—',
          city: s.city || '—',
          store: s.store || '—',
          shifts: []
        };
      }
      if (pilotMap[key].city === '—' && s.city && s.city !== '—') pilotMap[key].city = s.city;
      if (pilotMap[key].store === '—' && s.store && s.store !== '—') pilotMap[key].store = s.store;
      pilotMap[key].shifts.push(s);
    });

    const pilots = Object.values(pilotMap).map(p => {
      const totalShifts = p.shifts.length;
      const attendedShifts = p.shifts.filter(s => s.attended);
      const attendedCount = attendedShifts.length;
      const packages = attendedShifts.reduce((acc, s) => acc + (Number(s.packages) || 0), 0);
      const hours = attendedShifts.reduce((acc, s) => acc + (Number(s.hours) || 8), 0);
      const prodPaqH = hours > 0 ? (packages / hours) : 0;

      // Cancelaciones imputables exclusivamente al piloto
      const pilotCancels = p.shifts.filter(s => !isOperationalShiftExcluded(s.status) && isOperationalPilotCancel(s)).length;

      const evaluableShifts = attendedCount + pilotCancels;
      const attendancePct = evaluableShifts > 0 ? (attendedCount / evaluableShifts) * 100 : 0;

      return {
        pilot: p.pilot,
        pilot_id: p.pilot_id,
        city: p.city,
        store: p.store,
        totalShifts,
        attendedCount,
        pilotCancels,
        evaluableShifts,
        packages,
        hours,
        prodPaqH: +prodPaqH.toFixed(2),
        attendancePct: +attendancePct.toFixed(1)
      };
    });

    // Menor productividad: pilotos que efectivamente operaron turnos (attendedCount >= 1 y hours >= 8)
    const lowestProd = pilots.slice()
      .filter(p => p.attendedCount >= 1 && p.hours >= 8)
      .sort((a, b) => (a.prodPaqH - b.prodPaqH) || (a.packages - b.packages) || (a.attendancePct - b.attendancePct))
      .slice(0, topNProd);

    // Peor asistencia: pilotos con al menos 1 turno evaluable y con faltas (pilotCancels > 0)
    // o menor % de asistencia
    const worstAtt = pilots.slice()
      .filter(p => p.evaluableShifts >= 1 && (p.pilotCancels > 0 || p.attendancePct < 100))
      .sort((a, b) => (a.attendancePct - b.attendancePct) || (b.pilotCancels - a.pilotCancels) || (a.attendedCount - b.attendedCount))
      .slice(0, topNAtt);

    return { lowestProd, worstAtt };
  },

  /**
   * REQUERIMIENTO 6: Feedback Ejecutivo y Recomendaciones Operativas
   */
  generateExecutiveFeedback(currKpis, prevKpis, topStores, topPilotsProd, topPilotsAtt, coverageStores) {
    if (!currKpis) return null;

    // Resumen general
    const eff = currKpis.asistenciaEffectivenessPct != null ? currKpis.asistenciaEffectivenessPct.toFixed(1) + '%' : 'N/A';
    const can = currKpis.cancellationRatePct != null ? currKpis.cancellationRatePct.toFixed(1) + '%' : 'N/A';
    const cov = currKpis.cuposCoveragePct != null ? currKpis.cuposCoveragePct.toFixed(1) + '%' : 'N/A';
    const prod = (currKpis.fleetProductivityPaqH || 0).toFixed(2);
    const paqs = (currKpis.totalPackages || 0).toLocaleString();
    const faltantes = currKpis.cuposFaltantesTotal || 0;

    // Comparación histórica (frente a prevKpis si existe)
    const historyDeltas = [];
    if (prevKpis) {
      if (currKpis.fleetProductivityPaqH != null && prevKpis.fleetProductivityPaqH != null) {
        const diffP = +(currKpis.fleetProductivityPaqH - prevKpis.fleetProductivityPaqH).toFixed(2);
        historyDeltas.push({
          kpi: 'Productividad',
          diff: diffP,
          unit: 'paq/h',
          favorable: diffP >= 0
        });
      }
      if (currKpis.asistenciaEffectivenessPct != null && prevKpis.asistenciaEffectivenessPct != null) {
        const diffA = +(currKpis.asistenciaEffectivenessPct - prevKpis.asistenciaEffectivenessPct).toFixed(1);
        historyDeltas.push({
          kpi: 'Efectividad Asistencia',
          diff: diffA,
          unit: '%',
          favorable: diffA >= 0
        });
      }
      if (currKpis.cancellationRatePct != null && prevKpis.cancellationRatePct != null) {
        const diffC = +(currKpis.cancellationRatePct - prevKpis.cancellationRatePct).toFixed(1);
        historyDeltas.push({
          kpi: 'Tasa Cancelación',
          diff: diffC,
          unit: '%',
          favorable: diffC <= 0 // menos cancelación es favorable
        });
      }
    }

    // Puntos críticos y oportunidades
    const criticalStores = (coverageStores || []).filter(s => s.missing > 0).slice(0, 3);
    const highReplacementStores = (coverageStores || []).filter(s => s.replacementsPct > 20).slice(0, 3);

    // Recomendaciones accionables
    const recommendations = [];
    if (topStores && topStores.length > 0) {
      recommendaciones = recommendations.concat([
        `Replicar la planificación operativa y rotación de <strong>${topStores[0].store}</strong> (${topStores[0].prodPaqH} paq/h), líder en productividad.`
      ]);
    }
    if (criticalStores.length > 0) {
      const names = criticalStores.map(s => `${s.store} (${s.missing} faltantes)`).join(', ');
      recommendations.push(`Reforzar la asignación preventiva y bancos de suplentes en: <strong>${names}</strong>.`);
    }
    if (highReplacementStores.length > 0) {
      const repNames = highReplacementStores.map(s => `${s.store} (${s.replacementsPct}%)`).join(', ');
      recommendations.push(`Auditar causas raíz de cancelaciones en tiendas con alta dependencia de reemplazos: <strong>${repNames}</strong>.`);
    }
    if (topPilotsAtt && topPilotsAtt.length > 0) {
      recommendations.push(`Reconocer y fidelizar a pilotos élite de asistencia como <strong>${topPilotsAtt[0].pilot}</strong> (${topPilotsAtt[0].attendancePct}% cumplido).`);
    }

    return {
      summary: `La operación registró <strong>${paqs} paquetes</strong> con una productividad promedio de <strong>${prod} paq/h</strong> y una cobertura de cupos del <strong>${cov}</strong>. La efectividad de asistencia se situó en <strong>${eff}</strong> con una tasa de cancelación del <strong>${can}</strong>.`,
      faltantes,
      historyDeltas,
      topStore: topStores && topStores[0] ? topStores[0] : null,
      topPilotProd: topPilotsProd && topPilotsProd[0] ? topPilotsProd[0] : null,
      topPilotAtt: topPilotsAtt && topPilotsAtt[0] ? topPilotsAtt[0] : null,
      criticalStores,
      highReplacementStores,
      recommendations
    };
  },

  /**
   * ANÁLISIS DINÁMICO POR CIUDAD Y TIENDA
   * Genera interpretación ejecutiva de indicadores por ciudad y/o tienda
   * según el filtro activo del selector de la gráfica.
   *
   * @param {Array} shifts   - Turnos filtrados por semana+ciudad+tienda del header
   * @param {string} selectedCity - Ciudad seleccionada en el selector de la gráfica ('' = todas)
   * @returns {Object} análisis con niveles city y store
   */
  computeCityStoreAnalysis(shifts, selectedCity = '') {
    if (!shifts || shifts.length === 0) {
      return { mode: 'empty', city: null, store: null };
    }

    const isStoreView = Boolean(selectedCity && selectedCity.trim() !== '');

    // ── Función auxiliar: calcular KPIs de un grupo de turnos ────────────────
    const computeGroupKpis = (groupShifts) => {
      let totalShifts = 0, attended = 0, cancels = 0, reemplazos = 0,
          packages = 0, hours = 0;

      groupShifts.forEach(s => {
        const isPilotCancel = isOperationalPilotCancel(s);
        const isExcluded = isOperationalShiftExcluded(s.status);
        if (!isExcluded) {
          totalShifts++;
          if (s.attended) attended++;
          if (isPilotCancel) cancels++;
          if (String(s.status || '').toLowerCase().trim() === 'reemplazo') reemplazos++;
        }
        if (s.attended) {
          packages += (Number(s.packages) || 0);
          hours    += (Number(s.hours)    || 8);
        }
      });

      const coveragePct  = totalShifts > 0 ? +((attended / totalShifts) * 100).toFixed(1) : 0;
      const cancelPct    = totalShifts > 0 ? +((cancels  / totalShifts) * 100).toFixed(1) : 0;
      const replacePct   = attended > 0    ? +((reemplazos / attended)  * 100).toFixed(1) : 0;
      const prodPaqH     = hours > 0       ? +(packages / hours).toFixed(2)               : 0;
      return { totalShifts, attended, cancels, reemplazos, packages, hours,
               coveragePct, cancelPct, replacePct, prodPaqH };
    };

    // ── MODO TIENDA: ciudad seleccionada → comparar sus tiendas ─────────────
    if (isStoreView) {
      const cityShifts = shifts.filter(s =>
        (s.city || '').toLowerCase() === selectedCity.toLowerCase()
      );
      if (cityShifts.length === 0) return { mode: 'empty', city: null, store: null };

      // Agrupar por tienda
      const storeMap = {};
      cityShifts.forEach(s => {
        const key = (s.store || 'Sin Tienda').trim();
        if (!storeMap[key]) storeMap[key] = { name: key, shifts: [] };
        storeMap[key].shifts.push(s);
      });

      const stores = Object.values(storeMap)
        .map(st => ({ name: st.name, kpi: computeGroupKpis(st.shifts), count: st.shifts.length }))
        .filter(st => st.kpi.totalShifts > 0)
        .sort((a, b) => b.kpi.totalShifts - a.kpi.totalShifts);

      if (stores.length === 0) return { mode: 'empty', city: null, store: null };

      const globalCityKpi = computeGroupKpis(cityShifts);

      // Rankings
      const byProd    = stores.slice().sort((a, b) => b.kpi.prodPaqH - a.kpi.prodPaqH);
      const byCovLow  = stores.slice().sort((a, b) => a.kpi.coveragePct - b.kpi.coveragePct);
      const byCancHi  = stores.slice().sort((a, b) => b.kpi.cancelPct  - a.kpi.cancelPct);
      const byReplHi  = stores.slice().sort((a, b) => b.kpi.reemplazos - a.kpi.reemplazos || b.kpi.replacePct - a.kpi.replacePct);

      const bestStore       = byProd[0];
      const worstStore      = byCovLow[0];
      const worstCanc       = byCancHi[0];
      const topReplaceStore = byReplHi[0];

      const avgProd    = stores.length > 0
        ? +(stores.reduce((a, s) => a + s.kpi.prodPaqH, 0) / stores.length).toFixed(2) : 0;

      // Hallazgos
      const findings = [];
      if (globalCityKpi.coveragePct < 85) {
        findings.push({ icon: '🔴', text: `Cobertura general de la ciudad por debajo del umbral (${globalCityKpi.coveragePct}%). Verificar disponibilidad de pilotos.` });
      } else if (globalCityKpi.coveragePct >= 95) {
        findings.push({ icon: '🟢', text: `Cobertura en ${selectedCity} es sólida (${globalCityKpi.coveragePct}%). La operación está bien cubierta.` });
      }

      if (worstCanc && worstCanc.kpi.cancelPct > 20) {
        findings.push({ icon: '⚠️', text: `${worstCanc.name} concentra la mayor tasa de cancelación (${worstCanc.kpi.cancelPct}%). Requiere seguimiento prioritario.` });
      }

      if (bestStore && worstStore && bestStore.name !== worstStore.name) {
        const diff = +(bestStore.kpi.prodPaqH - worstStore.kpi.prodPaqH).toFixed(2);
        if (diff > 0.3) {
          findings.push({ icon: '📊', text: `Brecha de productividad de ${diff} paq/h entre ${bestStore.name} (${bestStore.kpi.prodPaqH}) y ${worstStore.name} (${worstStore.kpi.prodPaqH}).` });
        }
      }

      if (globalCityKpi.replacePct > 20) {
        findings.push({ icon: '🔄', text: `Alta dependencia de reemplazos en ${selectedCity}: ${globalCityKpi.reemplazos} turnos cubiertos por suplentes (${globalCityKpi.replacePct}% de los turnos cubiertos). Evaluar estabilidad y ausentismo de la planta titular.` });
      } else if (globalCityKpi.replacePct > 10) {
        findings.push({ icon: '🔄', text: `Uso moderado de suplencias en ${selectedCity}: ${globalCityKpi.reemplazos} reemplazos (${globalCityKpi.replacePct}% de turnos cubiertos). Operación dentro del rango controlado.` });
      } else if (globalCityKpi.attended > 0) {
        findings.push({ icon: '🛡️', text: `Alta estabilidad de planta en ${selectedCity}: solo ${globalCityKpi.reemplazos} reemplazos (${globalCityKpi.replacePct}% de turnos cubiertos). Mínima dependencia de suplencias.` });
      }

      if (topReplaceStore && topReplaceStore.kpi.reemplazos > 0) {
        findings.push({ icon: '🏪', text: `Punto con mayor volumen de suplencias: ${topReplaceStore.name} registra ${topReplaceStore.kpi.reemplazos} reemplazos (${topReplaceStore.kpi.replacePct}% de su asistencia).` });
      }

      if (findings.length === 0) {
        findings.push({ icon: '✅', text: `Operación equilibrada en ${selectedCity}. Todos los indicadores dentro de rangos aceptables.` });
      }

      return {
        mode: 'store',
        selectedCity,
        globalCityKpi,
        stores,
        bestStore,
        worstStore,
        worstCanc,
        topReplaceStore,
        avgProd,
        storeCount: stores.length,
        findings
      };
    }

    // ── MODO CIUDAD: "Todas las ciudades" → comparar ciudades ────────────────
    const cityMap = {};
    shifts.forEach(s => {
      const key = (s.city || 'Sin Ciudad').trim();
      if (!cityMap[key]) cityMap[key] = { name: key, shifts: [] };
      cityMap[key].shifts.push(s);
    });

    const cities = Object.values(cityMap)
      .map(c => ({ name: c.name, kpi: computeGroupKpis(c.shifts) }))
      .filter(c => c.kpi.totalShifts > 0)
      .sort((a, b) => b.kpi.totalShifts - a.kpi.totalShifts);

    if (cities.length === 0) return { mode: 'empty', city: null, store: null };

    const globalKpi = computeGroupKpis(shifts);

    // Rankings ciudades
    const byProd    = cities.slice().sort((a, b) => b.kpi.prodPaqH    - a.kpi.prodPaqH);
    const byCov     = cities.slice().sort((a, b) => b.kpi.coveragePct - a.kpi.coveragePct);
    const byCovLow  = cities.slice().sort((a, b) => a.kpi.coveragePct - b.kpi.coveragePct);
    const byCancHi  = cities.slice().sort((a, b) => b.kpi.cancelPct   - a.kpi.cancelPct);
    const byReplHi  = cities.slice().sort((a, b) => b.kpi.reemplazos  - a.kpi.reemplazos || b.kpi.replacePct - a.kpi.replacePct);

    const bestCity       = byProd[0];
    const alertCity      = byCovLow[0];
    const highCancCity   = byCancHi[0];
    const topReplaceCity = byReplHi[0];

    const avgProd = cities.length > 0
      ? +(cities.reduce((a, c) => a + c.kpi.prodPaqH, 0) / cities.length).toFixed(2) : 0;

    // Hallazgos
    const findings = [];
    if (globalKpi.coveragePct >= 90) {
      findings.push({ icon: '🟢', text: `Cobertura operativa global sólida: ${globalKpi.coveragePct}% de turnos cubiertos en todas las ciudades.` });
    } else {
      findings.push({ icon: '🔴', text: `Cobertura global por debajo del 90% (${globalKpi.coveragePct}%). Revisar disponibilidad de pilotos.` });
    }

    if (alertCity && alertCity.kpi.coveragePct < 85) {
      findings.push({ icon: '⚠️', text: `${alertCity.name} registra la menor cobertura (${alertCity.kpi.coveragePct}%). Priorizar intervención inmediata.` });
    }

    if (highCancCity && highCancCity.kpi.cancelPct > 15) {
      findings.push({ icon: '📋', text: `${highCancCity.name} presenta la mayor tasa de cancelación (${highCancCity.kpi.cancelPct}%). Evaluar causas y acciones de retención.` });
    }

    if (bestCity && alertCity && bestCity.name !== alertCity.name) {
      const diff = +(bestCity.kpi.prodPaqH - alertCity.kpi.prodPaqH).toFixed(2);
      if (diff > 0.2) {
        findings.push({ icon: '📊', text: `Diferencia de productividad entre ciudades: ${bestCity.name} lidera con ${bestCity.kpi.prodPaqH} paq/h vs ${alertCity.name} con ${alertCity.kpi.prodPaqH} paq/h.` });
      }
    }

    if (globalKpi.replacePct > 15) {
      findings.push({ icon: '🔄', text: `Dependencia operativa global de reemplazos: ${globalKpi.reemplazos} turnos cubiertos por suplentes (${globalKpi.replacePct}% a nivel nacional). Alta rotación o ausentismo en la operación.` });
    } else if (globalKpi.replacePct > 8) {
      findings.push({ icon: '🔄', text: `Uso controlado de reemplazos: ${globalKpi.reemplazos} turnos suplidos a nivel nacional (${globalKpi.replacePct}% del total asistido). Margen adecuado de soporte.` });
    } else if (globalKpi.attended > 0) {
      findings.push({ icon: '🛡️', text: `Sólida estabilidad de planta nacional: solo ${globalKpi.reemplazos} turnos cubiertos por reemplazos (${globalKpi.replacePct}% del total asistido).` });
    }

    if (topReplaceCity && topReplaceCity.kpi.reemplazos > 0) {
      findings.push({ icon: '🏙️', text: `Ciudad con mayor volumen de reemplazos: ${topReplaceCity.name} lidera con ${topReplaceCity.kpi.reemplazos} suplencias (${topReplaceCity.kpi.replacePct}% de sus turnos cubiertos).` });
    }

    if (findings.length === 0) {
      findings.push({ icon: '✅', text: 'Operación estable en todas las ciudades. Los indicadores se encuentran dentro de rangos aceptables.' });
    }

    return {
      mode: 'city',
      selectedCity: '',
      globalKpi,
      cities,
      bestCity,
      alertCity,
      highCancCity,
      topReplaceCity,
      avgProd,
      cityCount: cities.length,
      findings
    };
  }
};


if (typeof window !== 'undefined') {
  window.Modulo3IntelligenceEngine = Modulo3IntelligenceEngine;
}
if (typeof global !== 'undefined') {
  global.Modulo3IntelligenceEngine = Modulo3IntelligenceEngine;
}
