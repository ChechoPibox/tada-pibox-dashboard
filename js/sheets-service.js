// ============================================================
// SERVICIO DE INGESTA EN TIEMPO REAL GOOGLE SHEETS - TADA / PIBOX
// Sincronización automática vía Fetch / Google Visualization API (GViz)
// ============================================================

const SheetsService = {
  // URLs de los Google Sheets oficiales
  // GID 0 = RESTO DE CIUDADES (Bogotá, Bucaramanga, Medellín, Barranquilla, Santa Marta) = 15,835+ registros
  sheet1RestoUrl: 'https://docs.google.com/spreadsheets/d/1ukufIN9kWUAK5olBGvfs30UV5u-pgwPblKyQxWnwyfI/gviz/tq?tqx=out:csv&gid=0',
  // GID 62616103 = CALI (Hoja oficial de Cali actualizada con los últimos meses incluyendo Septiembre) = 3,412+ registros
  sheet1CaliUrl: 'https://docs.google.com/spreadsheets/d/1ukufIN9kWUAK5olBGvfs30UV5u-pgwPblKyQxWnwyfI/gviz/tq?tqx=out:csv&gid=62616103',
  // Retrocompatibilidad
  sheet1MallaUrl: 'https://docs.google.com/spreadsheets/d/1ukufIN9kWUAK5olBGvfs30UV5u-pgwPblKyQxWnwyfI/gviz/tq?tqx=out:csv&gid=0',
  // Sheet 2: Programación activa y preventiva (cupos y turnos vigentes)
  sheet2ProgUrl: 'https://docs.google.com/spreadsheets/d/1a1-ZUpdz8B1JW8W0wLCPhpwNawnlPApLG6v5yKfsoeI/gviz/tq?tqx=out:csv&gid=1638581759',
  // GID 723253237 = Matriz de Productividad [PUNTO + DÍA + INICIO + PROM. PAQ]
  sheetProductividadUrl: 'https://docs.google.com/spreadsheets/d/1ukufIN9kWUAK5olBGvfs30UV5u-pgwPblKyQxWnwyfI/gviz/tq?tqx=out:csv&gid=723253237',

  /**
   * Normaliza cualquier formato de fecha a string ISO 'YYYY-MM-DD'
   * Soporta 'DD/MM/YYYY', 'D/M/YYYY', 'YYYY-MM-DD', números seriales de Excel
   */
  normalizeDate(str) {
    if (!str) return '';
    const s = String(str).trim();
    if (typeof parseHybridDate === 'function') {
      const hybrid = parseHybridDate(s);
      if (hybrid) return hybrid;
    }
    if (s.includes('/')) {
      const clean = s.split(' ')[0].split('T')[0];
      const parts = clean.split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${y}-${m}-${d}`;
      }
    }
    if (s.includes('-') && s.length >= 10) {
      const clean = s.split(' ')[0].split('T')[0];
      if (clean.length === 10) return clean;
    }
    const num = Number(s);
    if (!isNaN(num) && num > 30000 && num < 60000) {
      const utcDays = Math.floor(num - 25569);
      const date = new Date(utcDays * 86400 * 1000);
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return s;
  },

  /**
   * Convierte hora en string HH:MM o decimal a minutos del día (0-1440)
   */
  timeToMinutes(val) {
    if (val == null || val === '') return null;
    const s = String(val).trim();
    if (s.includes(':')) {
      const parts = s.split(':');
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      return h * 60 + m;
    }
    const num = parseFloat(s);
    if (!isNaN(num)) {
      if (num >= 0 && num <= 1) return Math.round(num * 1440);
      if (num > 1 && num <= 24) return Math.round(num * 60);
      return Math.round(num);
    }
    return null;
  },

  /**
   * Obtiene la fecha de referencia efectiva:
   * Si la fecha real de hoy está más de 7 días desfasada respecto al último turno registrado
   * en Malla, ancla la referencia a la fecha del último turno para que la semana actual
   * represente la última semana operativa real con datos.
   */
  getEffectiveRefDate(shifts) {
    const today = new Date();
    if (!shifts || shifts.length === 0) return today;
    let maxDate = '';
    for (let i = 0; i < shifts.length; i++) {
      const d = shifts[i].date;
      if (d && d.length >= 10 && d > maxDate) maxDate = d;
    }
    if (!maxDate) return today;
    const maxD = typeof parseDateToNoon === 'function' ? parseDateToNoon(maxDate) : new Date(maxDate + 'T12:00:00');
    if (maxD && !isNaN(maxD.getTime())) {
      const diffDays = (today.getTime() - maxD.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 7) {
        return maxD;
      }
    }
    return today;
  },

  /**
   * Calcula el contexto temporal de la semana actual y las 2 anteriores (3 semanas)
   * Aplicando corte horario estricto a las 12:00 PM (mediodía) para interpretar el día puntual
   * y cerrar las semanas exactamente de Lunes a Domingo sin desfasaje de medianoche.
   */
  getRollingTemporalWindow(referenceDate = new Date()) {
    let ref;
    if (typeof referenceDate === 'string') {
      const parts = referenceDate.substring(0, 10).split('-');
      ref = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0, 0);
    } else {
      ref = new Date(referenceDate);
      ref.setHours(12, 0, 0, 0);
    }

    // Formateador YYYY-MM-DD local a las 12 PM
    const toIsoNoon = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Obtener lunes de la semana actual (1=Lunes, 0=Domingo -> diff -6)
    const dayOfWeek = ref.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

    // Lunes de la semana actual con corte horario a las 12:00 PM
    const currentMonday = new Date(ref);
    currentMonday.setDate(ref.getDate() + diffToMonday);
    currentMonday.setHours(12, 0, 0, 0);

    // Domingo de la semana actual (+6 días exactos) con corte horario a las 12:00 PM
    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);
    currentSunday.setHours(12, 0, 0, 0);

    // Ventana de contexto/scoring: 2 semanas previas (14 días atrás a las 12:00 PM)
    const windowStart = new Date(currentMonday);
    windowStart.setDate(currentMonday.getDate() - 14);
    windowStart.setHours(12, 0, 0, 0);

    // Ventana histórica ampliada: 12 semanas (84 días atrás a las 12:00 PM)
    const mallaWindowStart = new Date(currentMonday);
    mallaWindowStart.setDate(currentMonday.getDate() - 84);
    mallaWindowStart.setHours(12, 0, 0, 0);

    // Número de semana ISO
    const dIso = new Date(Date.UTC(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate(), 12, 0, 0));
    const dayNum = dIso.getUTCDay() || 7;
    dIso.setUTCDate(dIso.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dIso.getUTCFullYear(), 0, 1, 12, 0, 0));
    const weekNumber = Math.ceil((((dIso - yearStart) / 86400000) + 1) / 7);

    // Semanas previas calculadas a las 12:00 PM
    const prevMon1 = new Date(currentMonday);
    prevMon1.setDate(currentMonday.getDate() - 7);
    prevMon1.setHours(12, 0, 0, 0);
    const prevSun1 = new Date(prevMon1);
    prevSun1.setDate(prevMon1.getDate() + 6);
    prevSun1.setHours(12, 0, 0, 0);

    const prevMon2 = new Date(currentMonday);
    prevMon2.setDate(currentMonday.getDate() - 14);
    prevMon2.setHours(12, 0, 0, 0);
    const prevSun2 = new Date(prevMon2);
    prevSun2.setDate(prevMon2.getDate() + 6);
    prevSun2.setHours(12, 0, 0, 0);

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const curMonLabel = `${currentMonday.getDate()} ${monthNames[currentMonday.getMonth()]}`;
    const curSunLabel = `${currentSunday.getDate()} ${monthNames[currentSunday.getMonth()]} ${currentSunday.getFullYear()}`;

    return {
      todayIso: toIsoNoon(ref),
      currentWeek: {
        weekNumber,
        startDate: toIsoNoon(currentMonday),
        endDate: toIsoNoon(currentSunday),
        label: `Sem ${weekNumber} (${curMonLabel} – ${curSunLabel})`
      },
      windowStart: toIsoNoon(windowStart),
      windowEnd: toIsoNoon(currentSunday),
      mallaWindowStart: toIsoNoon(mallaWindowStart),
      previousWeek1: {
        startDate: toIsoNoon(prevMon1),
        endDate: toIsoNoon(prevSun1)
      },
      previousWeek2: {
        startDate: toIsoNoon(prevMon2),
        endDate: toIsoNoon(prevSun2)
      }
    };
  },

  /**
   * Parser robusto de CSV para manejar celdas con comillas y saltos de línea
   */
  parseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // saltar comilla escapada
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) rows.push(currentRow);
    }
    return rows;
  },

  /**
   * Sincroniza en tiempo real los dos Google Sheets
   */
  async syncAll(onProgress) {
    if (onProgress) onProgress('Conectando con Google Sheets en tiempo real...', 10);

    // 0. Fetch Hoja de Metas de Productividad (GID=723253237) para asegurar metas actualizadas (ej. Bello)
    try {
      if (onProgress) onProgress('Descargando Metas de Productividad (PROM. PAQ en tiempo real)...', 15);
      const respProd = await fetch(this.sheetProductividadUrl);
      if (respProd.ok) {
        const csvProd = await respProd.text();
        const parsedProd = this.parseCSV(csvProd);
        const dynamicTargets = this.processProductivityTargets(parsedProd);
        if (dynamicTargets && dynamicTargets.length > 0) {
          PRODUCTIVITY_TARGETS = dynamicTargets;
          console.log(`[SheetsService] Metas de productividad sincronizadas en vivo: ${dynamicTargets.length} reglas.`);
        }
      }
    } catch (e) {
      console.warn('[SheetsService] Error descargando metas en vivo, usando matriz base:', e);
    }

    // 1. Fetch Sheet 1: Resto de Ciudades (GID=0) y Cali Actualizada (GID=62616103)
    if (onProgress) onProgress('Descargando Hoja 1: Resto de Ciudades (Bogotá, Medellín, Bucaramanga, etc.)...', 25);
    const respResto = await fetch(this.sheet1RestoUrl);
    if (!respResto.ok) throw new Error(`Error ${respResto.status} conectando con Resto de Ciudades`);
    const csvResto = await respResto.text();
    const parsedResto = this.parseCSV(csvResto);

    if (onProgress) onProgress('Descargando Hoja 1: Cali (pestaña actualizada con últimos meses)...', 45);
    const respCali = await fetch(this.sheet1CaliUrl);
    if (!respCali.ok) throw new Error(`Error ${respCali.status} conectando con Hoja Cali`);
    const csvCali = await respCali.text();
    const parsedCali = this.parseCSV(csvCali);

    // 2. Fetch Sheet 2: Programación (Malla Activa / Preventiva)
    if (onProgress) onProgress('Descargando Hoja 2: Programación de Turnos...', 60);
    const resp2 = await fetch(this.sheet2ProgUrl);
    if (!resp2.ok) throw new Error(`Error ${resp2.status} conectando con Hoja 2`);
    const csv2 = await resp2.text();
    const parsed2 = this.parseCSV(csv2);

    if (onProgress) onProgress('Interpretando y fusionando turnos de todas las ciudades...', 75);

    const shiftsResto = this.processMallaData(parsedResto);
    const shiftsCali = this.processMallaData(parsedCali);
    const progShifts = this.processProgramacionData(parsed2);

    // Consolidar Malla: Cali actualizada (con Septiembre) + Resto de ciudades sin perder histórico
    const mallaShifts = [];
    const caliUniqueKeys = new Set();

    // 1. Priorizar registros de Cali desde su pestaña dedicada (GID=62616103)
    shiftsCali.forEach((s) => {
      s.city = s.city || 'Cali';
      const pKey = (s.pilot_id || s.pilot || '').toLowerCase().trim();
      const stKey = (s.status || '').toLowerCase().trim();
      const key = `cali|${(s.store || '').toLowerCase()}|${s.date}|${s.start}|${pKey}|${stKey}`;
      caliUniqueKeys.add(key);
      mallaShifts.push(s);
    });

    // 2. Incorporar las demás ciudades desde la pestaña Resto de Ciudades (GID=0) sin sobreescribir turnos
    shiftsResto.forEach((s) => {
      const isCali = (s.city || '').toLowerCase() === 'cali';
      if (isCali) {
        const pKey = (s.pilot_id || s.pilot || '').toLowerCase().trim();
        const stKey = (s.status || '').toLowerCase().trim();
        const key = `cali|${(s.store || '').toLowerCase()}|${s.date}|${s.start}|${pKey}|${stKey}`;
        if (!caliUniqueKeys.has(key)) {
          caliUniqueKeys.add(key);
          mallaShifts.push(s);
        }
      } else {
        mallaShifts.push(s);
      }
    });
    console.log(`[SheetsService] Malla fusionada: ${mallaShifts.length} turnos (Cali pestaña dedicada: ${shiftsCali.length}) | Prog total: ${progShifts.length} turnos`);

    const mallaCities = new Set(mallaShifts.map(s => s.city).filter(Boolean));
    console.log(`[SheetsService] Ciudades detectadas en Malla:`, [...mallaCities]);

    // Anclar la ventana operativa a los datos reales disponibles:
    // Si la fecha actual supera por más de 7 días al último turno registrado,
    // se ancla al último turno registrado para no mostrar semanas vacías al abrir el dashboard
    const effectiveRefDate = this.getEffectiveRefDate(mallaShifts);
    const temporal = this.getRollingTemporalWindow(effectiveRefDate);

    // Guardar el 100% de los datos históricos en IndexedDB para no perder semanas pasadas
    if (onProgress) onProgress('Guardando en base de datos local IndexedDB (todas las ciudades)...', 90);
    await TaDaDB.saveMallaShifts(mallaShifts);
    await TaDaDB.saveProgramacionShifts(progShifts);
    await TaDaDB.setMeta('last_sync', {
      timestamp: new Date().toISOString(),
      temporal,
      mallaCount: mallaShifts.length,
      progCount: progShifts.length,
      cities: [...mallaCities]
    });

    if (onProgress) onProgress('✅ Sincronización completada con éxito (' + mallaShifts.length + ' turnos)', 100);

    return {
      mallaShifts,
      progShifts,
      temporal
    };
  },

  /**
   * Procesa la matriz CSV de Sheet 1 (Malla)
   */
  processMallaData(csvRows) {
    if (!csvRows || csvRows.length < 2) return [];

    const headers = csvRows[0].map(h => h.trim().toUpperCase());
    const colFecha = headers.findIndex(h => h === 'FECHA' || h.includes('FECHA'));
    const colDia = headers.findIndex(h => h.includes('DÍA') || h.includes('DIA') || (h.startsWith('D') && h.includes('A') && h.length <= 5));
    const colPiloto = headers.findIndex(h => h.includes('NOMBRE DE PILOTO') || h === 'PILOTO');
    const colTel = headers.findIndex(h => h.includes('TELEFONO') || h.includes('TEL'));
    const colId = headers.findIndex(h => h.includes('ID PILOTO') || h === 'ID');
    const colCiudad = headers.findIndex(h => h.includes('CIUDAD'));
    const colSeller = headers.findIndex(h => h.includes('SELLER') || h.includes('PUNTO') || h.includes('STORE'));
    const colEstado = headers.findIndex(h => h.includes('ESTADO'));
    const colInicio = headers.findIndex(h => h.includes('INICIO DE TURNO') || h.includes('INICIO'));
    const colLlegada = headers.findIndex(h => h.includes('HORA LEGADA') || h.includes('HORA LLEGADA') || h.includes('LLEGADA'));
    const colPaq = headers.findIndex(h => h === 'PAQUETES' || h.startsWith('PAQ'));
    const colCanc = headers.findIndex(h => h.includes('CANCELADOS'));
    const colSla = headers.findIndex(h => h.includes('SLA 35'));

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const shifts = [];

    for (let i = 1; i < csvRows.length; i++) {
      const r = csvRows[i];
      const rawPilot = String(r[colPiloto] || '').trim();
      const rawStatus = String(r[colEstado] || '').trim();
      if (!rawPilot && !rawStatus) continue;

      const dateStr = this.normalizeDate(r[colFecha]);
      let weekday = colDia >= 0 ? String(r[colDia] || '').trim() : '';
      if (!weekday && dateStr) {
        const dObj = new Date(dateStr + 'T12:00:00');
        if (!isNaN(dObj.getTime())) weekday = dayNames[dObj.getDay()];
      }

      const pilotId = String(r[colId] || '').trim();
      const phone = String(r[colTel] || '').trim();
      const city = String(r[colCiudad] || '').trim();
      const store = String(r[colSeller] || '').trim();

      const startMin = this.timeToMinutes(r[colInicio]);
      const arrivalMin = this.timeToMinutes(r[colLlegada]);
      const packages = parseFloat(r[colPaq]) || 0;
      const cancelled = parseFloat(r[colCanc]) || 0;
      const sla = parseFloat(r[colSla]) || 0;

      const classification = classifyShiftStatus(rawStatus);

      // Match compuesto de productividad: [PUNTO + DÍA + INICIO]
      const prodTarget = findProductivityTargetExact(store, weekday, startMin);
      const evalProd = evaluateProductivityMatch(packages, prodTarget);

      shifts.push({
        date: dateStr,
        weekday,
        pilot: rawPilot,
        pilot_id: pilotId,
        phone,
        city,
        store,
        status: rawStatus,
        start: startMin,
        arrival: arrivalMin,
        packages,
        cancelled_packages: cancelled,
        packages_cancelled: cancelled,
        cancelled: cancelled,
        hours: classification.attended ? 8 : 0,
        attended: classification.attended,
        pilot_cancel: classification.pilotCancel,
        excluded: classification.excluded,
        evaluable: classification.evaluable,
        punctual: (startMin != null && arrivalMin != null)
          ? (typeof isShiftPunctualWithGabela === 'function' ? isShiftPunctualWithGabela(startMin, arrivalMin) : arrivalMin <= startMin)
          : null,
        sla35: sla,
        target_productivity: prodTarget,
        productivity_eval: evalProd,
        store_packages: packages,
        low_demand: false
      });
    }

    return shifts;
  },

  /**
   * Procesa la matriz CSV de Sheet 2 (Programación de Turnos)
   * Aplica la Observación 1: si tiene tienda pero piloto, tel e id están vacíos -> CUPO FALTANTE
   */
  processProgramacionData(csvRows) {
    if (!csvRows || csvRows.length < 2) return [];

    const headers = csvRows[0].map(h => h.trim().toUpperCase());
    const colFecha = headers.findIndex(h => h.includes('FECHA'));
    const colDia = headers.findIndex(h => h.includes('DÍA') || h.includes('DIA') || (h.startsWith('D') && h.includes('A') && h.length <= 5));
    const colPiloto = headers.findIndex(h => h.includes('NOMBRE DE PILOTO') || h.includes('PILOTO'));
    const colTel = headers.findIndex(h => h.includes('TELEFONO') || h.includes('TEL'));
    const colId = headers.findIndex(h => h.includes('ID PILOTO') || h.includes('ID'));
    const colCiudad = headers.findIndex(h => h.includes('CIUDAD'));
    const colPunto = headers.findIndex(h => h.includes('PUNTO') || h.includes('SELLER') || h.includes('TIENDA'));
    const colEstado = headers.findIndex(h => h.includes('ESTADO'));
    const colInicio = headers.findIndex(h => h.includes('INICIO DE TURNO') || h.includes('INICIO'));
    const colFin = headers.findIndex(h => h.includes('HORA FINAL') || h.includes('FIN'));
    const colLlegada = headers.findIndex(h => h.includes('HORA DE LLEGADA') || h.includes('LLEGADA'));
    const colBooking = headers.findIndex(h => h.includes('BOOKING'));

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const progShifts = [];

    for (let i = 1; i < csvRows.length; i++) {
      const r = csvRows[i];
      const store = String(r[colPunto] || '').trim();
      const rawPilot = String(r[colPiloto] || '').trim();
      const rawTel = String(r[colTel] || '').trim();
      const rawId = String(r[colId] || '').trim();

      // Si no tiene tienda asignada y no tiene piloto, ignorar fila vacía
      if (!store && !rawPilot) continue;

      const dateStr = this.normalizeDate(r[colFecha]);
      let weekday = colDia >= 0 ? String(r[colDia] || '').trim() : '';
      if (!weekday && dateStr) {
        const dObj = new Date(dateStr + 'T12:00:00');
        if (!isNaN(dObj.getTime())) weekday = dayNames[dObj.getDay()];
      }

      const city = String(r[colCiudad] || '').trim();
      const rawStatus = String(r[colEstado] || '').trim();
      const startMin = this.timeToMinutes(r[colInicio]);
      const endMin = this.timeToMinutes(r[colFin]);
      const arrivalMin = this.timeToMinutes(r[colLlegada]);
      const booking = String(r[colBooking] || '').trim();

      // REGLA OFICIAL OBSERVACIÓN 1:
      // Si tiene asignada una tienda, y no tiene nombre, ni teléfono, ni ID -> CUPO FALTANTE
      const isVacant = Boolean(store && !rawPilot && !rawTel && !rawId);

      progShifts.push({
        date: dateStr,
        weekday,
        pilot: isVacant ? '[SIN ASIGNAR]' : rawPilot,
        pilot_id: rawId,
        phone: rawTel,
        city,
        store,
        status: isVacant ? 'Cupo Faltante' : (rawStatus || 'Programado'),
        start: startMin,
        end_time: endMin,
        arrival: arrivalMin,
        booking,
        is_vacant: isVacant,
        risk_scoring: null // Calculado por CoverageEngine
      });
    }

    return progShifts;
  },

  /**
   * Procesa la matriz CSV de Productividad (GID 723253237)
   */
  processProductivityTargets(csvRows) {
    if (!csvRows || csvRows.length < 2) return null;
    const headers = csvRows[0].map(h => h.trim().toUpperCase());
    const colPunto = headers.findIndex(h => h.includes('PUNTO') || h.includes('SELLER') || h.includes('TIENDA'));
    const colDia = headers.findIndex(h => h.includes('DÍA') || h.includes('DIA') || (h.startsWith('D') && h.includes('A') && h.length <= 5));
    const colInicio = headers.findIndex(h => h.includes('INICIO'));
    const colPaq = headers.findIndex(h => h.includes('PAQ') || h.includes('PROM'));
    if (colPunto === -1 || colDia === -1 || colInicio === -1 || colPaq === -1) return null;

    const targets = [];
    for (let i = 1; i < csvRows.length; i++) {
      const r = csvRows[i];
      const store = String(r[colPunto] || '').trim();
      const dia = String(r[colDia] || '').trim();
      const inicio = String(r[colInicio] || '').trim();
      const paq = parseFloat(r[colPaq]);
      if (!store || !dia || !inicio || isNaN(paq)) continue;

      const startMin = this.timeToMinutes(inicio);
      const startFrac = startMin != null ? String(startMin / 1440) : null;
      targets.push({
        store,
        weekday: dia,
        start_fraction: startFrac,
        start_minutes: startMin,
        target_packages: paq
      });
    }
    return targets;
  }
};
