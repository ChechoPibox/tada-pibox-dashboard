// ============================================================
// IMPORTADOR SEMANAL EXCEL / GOOGLE SHEETS - TADA / PIBOX
// Permite actualizar datos semanales sin tocar código
// ============================================================

const Importer = {
  /**
   * Convierte un número serial de fecha de Excel a string ISO YYYY-MM-DD
   */
  excelSerialToDate(serial) {
    if (!serial) return '';
    if (typeof serial === 'string' && serial.includes('-')) return serial.substring(0, 10);
    const num = Number(serial);
    if (isNaN(num)) return String(serial);
    // Excel base date: 1899-12-30 (accounting for 1900 leap year bug)
    const utcDays = Math.floor(num - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Convierte fracción de día o string HH:MM a minutos del día (0 - 1440)
   */
  timeToMinutes(val) {
    if (val == null || val === '') return null;
    if (typeof val === 'number') {
      if (val >= 0 && val <= 1) {
        return Math.round(val * 1440);
      }
      return Math.round(val);
    }
    const s = String(val).trim();
    if (s.includes(':')) {
      const parts = s.split(':');
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      return h * 60 + m;
    }
    const num = parseFloat(s);
    if (!isNaN(num) && num >= 0 && num <= 1) {
      return Math.round(num * 1440);
    }
    return null;
  },

  /**
   * Procesa un ArrayBuffer de un archivo Excel (.xlsx/.xls)
   */
  async processExcelBuffer(buffer, onProgress) {
    if (typeof XLSX === 'undefined') {
      throw new Error('La librería SheetJS (XLSX) no está disponible.');
    }

    if (onProgress) onProgress('Leyendo archivo Excel...');
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });

    const newRows = [];
    const newTargets = [];

    // 1. Procesar Hoja PRODUCTIVIDAD si existe
    const prodSheetName = workbook.SheetNames.find(n => n.toUpperCase().includes('PRODUCTIVIDAD'));
    if (prodSheetName) {
      if (onProgress) onProgress('Extrayendo metas de productividad...');
      const prodSheet = workbook.Sheets[prodSheetName];
      const prodJson = XLSX.utils.sheet_to_json(prodSheet, { header: 1, defval: '' });
      // Buscar fila con encabezados PUNTO, DÍA, INICIO DE TURNO, PROM. PAQ
      let headerIdx = -1;
      for (let i = 0; i < Math.min(10, prodJson.length); i++) {
        const row = prodJson[i].map(c => String(c).toUpperCase());
        if (row.some(c => c.includes('PUNTO')) && row.some(c => c.includes('PROM'))) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx !== -1) {
        const hRow = prodJson[headerIdx].map(c => String(c).toUpperCase());
        const colPunto = hRow.findIndex(c => c.includes('PUNTO'));
        const colDia = hRow.findIndex(c => c.includes('DÍA') || c.includes('DIA'));
        const colInicio = hRow.findIndex(c => c.includes('INICIO'));
        const colProm = hRow.findIndex(c => c.includes('PROM'));

        for (let i = headerIdx + 1; i < prodJson.length; i++) {
          const r = prodJson[i];
          const punto = String(r[colPunto] || '').trim();
          if (!punto) continue;
          const dia = String(r[colDia] || '').trim();
          const startMin = this.timeToMinutes(r[colInicio]);
          const promVal = parseFloat(r[colProm]);
          newTargets.push({
            store: punto,
            weekday: dia,
            start_minutes: startMin,
            target_packages: !isNaN(promVal) ? promVal : null
          });
        }
      }
    }

    // 2. Procesar Hojas de Turnos (RESTO DE CIUDADES, CALI, etc.)
    const shiftSheetNames = workbook.SheetNames.filter(n => {
      const up = n.toUpperCase();
      return up.includes('CIUDADES') || up.includes('CALI') || up.includes('MALLA') || up.includes('TRAFICO');
    });

    const targetSheets = shiftSheetNames.length > 0 ? shiftSheetNames : workbook.SheetNames.filter(n => !n.toUpperCase().includes('PRODUCTIVIDAD'));

    for (const sName of targetSheets) {
      if (onProgress) onProgress(`Procesando hoja ${sName}...`);
      const sheet = workbook.Sheets[sName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!json || json.length < 5) continue;

      // Buscar fila de encabezados
      let headRowIdx = -1;
      for (let i = 0; i < Math.min(15, json.length); i++) {
        const r = json[i].map(c => String(c).trim().toUpperCase());
        if (r.some(c => c.includes('FECHA')) && (r.some(c => c.includes('PILOTO')) || r.some(c => c.includes('ESTADO')))) {
          headRowIdx = i;
          break;
        }
      }
      if (headRowIdx === -1) continue;

      const headers = json[headRowIdx].map(c => String(c).trim().toUpperCase());
      const colFecha = headers.findIndex(c => c === 'FECHA' || c.includes('FECHA'));
      const colDia = headers.findIndex(c => c.startsWith('DÍA') || c.startsWith('DIA'));
      const colPiloto = headers.findIndex(c => c.includes('NOMBRE DE PILOTO') || c === 'PILOTO');
      const colId = headers.findIndex(c => c.includes('ID PILOTO') || c === 'ID');
      const colCiudad = headers.findIndex(c => c.includes('CIUDAD'));
      const colSeller = headers.findIndex(c => c.includes('SELLER') || c.includes('STORE') || c.includes('TIENDA') || c.includes('PUNTO'));
      const colEstado = headers.findIndex(c => c.includes('ESTADO'));
      const colInicio = headers.findIndex(c => c.includes('INICIO DE TURNO') || c.includes('INICIO'));
      const colLlegada = headers.findIndex(c => c.includes('HORA LEGADA') || c.includes('HORA LLEGADA') || c.includes('LLEGADA'));
      const colPaquetes = headers.findIndex(c => c === 'PAQUETES' || c.startsWith('PAQ'));
      const colCancelados = headers.findIndex(c => c.includes('CANCELADOS'));
      const colProd = headers.findIndex(c => c.includes('PRODUCTIVIDAD'));
      const colSla = headers.findIndex(c => c.includes('SLA 35'));
      const colGmv = headers.findIndex(c => c.includes('GMV'));

      for (let i = headRowIdx + 1; i < json.length; i++) {
        const r = json[i];
        const rawPilot = String(r[colPiloto] || '').trim();
        const rawStatus = String(r[colEstado] || '').trim();
        if (!rawPilot && !rawStatus) continue;

        const dateStr = this.excelSerialToDate(r[colFecha]);
        const pilotId = String(r[colId] || '').trim();
        const city = String(r[colCiudad] || (sName.toUpperCase().includes('CALI') ? 'Cali' : '')).trim();
        const store = String(r[colSeller] || '').trim();
        const weekday = String(r[colDia] || '').trim();

        const startMin = this.timeToMinutes(r[colInicio]);
        const arrivalMin = this.timeToMinutes(r[colLlegada]);
        const packages = parseFloat(r[colPaquetes]) || 0;
        const cancelled = parseFloat(r[colCancelados]) || 0;
        const sla = parseFloat(r[colSla]) || 0;
        const gmv = parseFloat(r[colGmv]) || 0;

        const classification = classifyShiftStatus(rawStatus);

        // Turno puntual si llegada <= inicio
        let punctual = null;
        if (startMin != null && arrivalMin != null) {
          punctual = arrivalMin <= startMin;
        }

        // Target de productividad
        const targetsMatrix = newTargets.length > 0 ? newTargets : (typeof PRODUCTIVITY_TARGETS !== 'undefined' ? PRODUCTIVITY_TARGETS : []);
        const targetProd = findProductivityTarget(store, weekday, startMin, targetsMatrix);

        newRows.push({
          date: dateStr,
          weekday,
          pilot: rawPilot,
          pilot_id: pilotId,
          city,
          store,
          status: rawStatus,
          start: startMin,
          arrival: arrivalMin,
          hours: classification.attended ? 8 : 0, // Jornada estándar 8h
          packages,
          cancelled_packages: cancelled,
          attended: classification.attended,
          pilot_cancel: classification.pilotCancel,
          excluded: classification.excluded,
          evaluable: classification.evaluable,
          punctual,
          sla35: sla,
          gmv,
          target_productivity: targetProd,
          actual_productivity: packages > 0 ? Math.round((packages / 8) * 10) / 10 : null,
          store_packages: packages,
          low_demand: false // se recalcula después con agregados por tienda/día
        });
      }
    }

    // 3. Post-proceso: Calcular demanda agregada por tienda y día
    const storeDayTotals = {};
    newRows.forEach(r => {
      if (!r.date || !r.store) return;
      const key = `${r.date}|${r.store}`;
      storeDayTotals[key] = (storeDayTotals[key] || 0) + (r.packages || 0);
    });

    newRows.forEach(r => {
      const key = `${r.date}|${r.store}`;
      const dayTotal = storeDayTotals[key] || 0;
      r.store_packages = dayTotal;
      if (r.target_productivity != null && r.target_productivity > 0) {
        const ratio = dayTotal / r.target_productivity;
        r.demand_ratio = ratio;
        r.low_demand = (ratio * 100) < (APP_CONFIG.demandLowThreshold || 70);
      }
    });

    return {
      rows: newRows,
      targets: newTargets,
      summary: {
        totalRows: newRows.length,
        cities: [...new Set(newRows.map(r => r.city).filter(Boolean))],
        stores: [...new Set(newRows.map(r => r.store).filter(Boolean))],
        pilots: [...new Set(newRows.map(r => r.pilot).filter(Boolean))].length,
        dates: [...new Set(newRows.map(r => r.date).filter(Boolean))].sort()
      }
    };
  }
};
