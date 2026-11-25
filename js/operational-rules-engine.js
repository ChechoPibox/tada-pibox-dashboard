// ============================================================
// MOTOR DE REGLAS DETERMINÍSTICO — TADA / PIBOX (FASE 2)
// Evalúa indicadores validados, genera alertas sin duplicidad
// y produce diagnósticos verificables con evidencia matemática.
// ============================================================

const OperationalRulesEngine = {
  // Catálogo de reglas configurables
  rules: [
    {
      id: 'R-COV-01',
      name: 'Vacantes Críticas por Tienda',
      category: 'cobertura',
      priority: 'CRITICO',
      description: 'Detecta tiendas que acumulan 2 o más cancelaciones sin reemplazo en el periodo evaluado.',
      evaluate(storeStats) {
        if (!storeStats) return null;
        if (storeStats.unmatchedCancels >= 2) {
          return {
            triggered: true,
            evidence: `${storeStats.unmatchedCancels} cancelados sin reemplazo en la tienda (de ${storeStats.cancels} cancelaciones totales y ${storeStats.replacements} reemplazos).`,
            recommendation: `Activar de inmediato el grupo de contingencia de pilotos para la tienda ${storeStats.store} y auditar los motivos de cancelación.`
          };
        }
        return null;
      }
    },
    {
      id: 'R-COV-02',
      name: 'Cobertura por Debajo del Umbral Operativo',
      category: 'cobertura',
      priority: 'ALTO',
      description: 'Identifica tiendas con cobertura de asistencia o cupos inferior al 90%.',
      evaluate(storeStats) {
        if (!storeStats || storeStats.scheduled < 5) return null;
        const cov = storeStats.coveragePct;
        if (cov < 90) {
          return {
            triggered: true,
            evidence: `Cobertura de cupos del ${cov.toFixed(1)}% (${storeStats.covered} de ${storeStats.scheduled} turnos requeridos).`,
            recommendation: `Revisar asignación de suplentes en turnos pico para ${storeStats.store} y asegurar confirmación con 24h de anticipación.`
          };
        }
        return null;
      }
    },
    {
      id: 'R-PRD-01',
      name: 'Baja Productividad Extrema en Tienda',
      category: 'productividad',
      priority: 'ALTO',
      description: 'Detecta tiendas con productividad inferior a 0.85 paq/h con volumen significativo de horas trabajadas.',
      evaluate(storeStats) {
        if (!storeStats || storeStats.hours < 20) return null;
        if (storeStats.productivity < 0.85) {
          return {
            triggered: true,
            evidence: `Productividad de ${storeStats.productivity.toFixed(2)} paq/h (${storeStats.packages} paquetes entregados en ${storeStats.hours.toFixed(1)} horas operativas).`,
            recommendation: `Auditar tiempos de preparación y entrega en ${storeStats.store}, evaluando si el radio de cobertura asignado está dilatado.`
          };
        }
        return null;
      }
    },
    {
      id: 'R-PRD-02',
      name: 'Productividad Sobresaliente en Tienda',
      category: 'productividad',
      priority: 'POSITIVO',
      description: 'Reconoce tiendas con productividad superior o igual a 1.40 paq/h con alta demanda y horas operativas.',
      evaluate(storeStats) {
        if (!storeStats || storeStats.hours < 30) return null;
        if (storeStats.productivity >= 1.40) {
          return {
            triggered: true,
            evidence: `Productividad destacada de ${storeStats.productivity.toFixed(2)} paq/h (${storeStats.packages} paquetes en ${storeStats.hours.toFixed(1)} horas).`,
            recommendation: `Documentar y replicar mejores prácticas operativas y de ruteo de ${storeStats.store} en las tiendas del mismo clúster.`
          };
        }
        return null;
      }
    },
    {
      id: 'R-PIL-01',
      name: 'Piloto con Cancelaciones Recurrentes',
      category: 'asistencia',
      priority: 'CRITICO',
      description: 'Identifica pilotos con 2 o más cancelaciones en la semana operativa.',
      evaluatePilot(pilotStats) {
        if (!pilotStats) return null;
        if (pilotStats.cancels >= 2) {
          return {
            triggered: true,
            evidence: `El piloto registra ${pilotStats.cancels} cancelaciones en el periodo (${pilotStats.attended} turnos asistidos de ${pilotStats.scheduled} programados).`,
            recommendation: `Citar al piloto ${pilotStats.pilot} para retroalimentación operativa y suspender asignación prioritaria en mallas futuras.`
          };
        }
        return null;
      }
    },
    {
      id: 'R-PIL-02',
      name: 'Piloto Élite de Alto Rendimiento',
      category: 'productividad',
      priority: 'POSITIVO',
      description: 'Reconoce pilotos con productividad superior a 1.35 paq/h y asistencia perfecta.',
      evaluatePilot(pilotStats) {
        if (!pilotStats || pilotStats.hours < 25) return null;
        if (pilotStats.productivity >= 1.35 && pilotStats.cancels === 0) {
          return {
            triggered: true,
            evidence: `Productividad élite de ${pilotStats.productivity.toFixed(2)} paq/h (${pilotStats.packages} paquetes en ${pilotStats.hours.toFixed(1)}h) con 0 cancelaciones.`,
            recommendation: `Asignar incentivo de constancia y postular a ${pilotStats.pilot} como líder/tutor de nuevos ingresos.`
          };
        }
        return null;
      }
    }
  ],

  /**
   * Evalúa el conjunto de turnos filtrados y genera el consolidado de alertas activas
   * con deduplicación por clave única: `${ruleId}__${entityType}__${entityKey}`.
   */
  evaluateOperationalContext(filteredMalla, filteredProg = []) {
    const alerts = [];
    if (!filteredMalla || filteredMalla.length === 0) {
      return { alerts: [], storeStats: {}, cityStats: {}, summary: null };
    }

    // 1. Agrupar por Tienda y Ciudad con clasificación normativa canónica
    const storeMap = {};
    const cityMap = {};

    filteredMalla.forEach(s => {
      const storeName = s.store || 'Sin Tienda';
      const cityName = s.city || 'Sin Ciudad';

      const cls = typeof classifyShiftStatus === 'function'
        ? classifyShiftStatus(s.status)
        : { attended: false, pilotCancel: false, clientCancel: false, excluded: false };
      const isPilotCancel = typeof isOperationalPilotCancel === 'function'
        ? isOperationalPilotCancel(s)
        : Boolean(cls.pilotCancel);
      const isClientCancel = Boolean(cls.clientCancel);
      const stLower = String(s.status || '').trim().toLowerCase();
      const isReplacement = stLower === 'reemplazo' || stLower === 'reemplazos';
      const isConfirmed = stLower === 'confirmado' || stLower === 'confirmados' || stLower === 'hibrido' || stLower === 'híbrido';

      // Horas efectivas: 8h por defecto para turnos asistidos cuando hours === 0
      const rawHours = Number(s.hours || 0);
      const effectiveHours = cls.attended ? (rawHours > 0 ? rawHours : 8) : 0;
      const pkgs = Number(s.packages || 0);

      if (!storeMap[storeName]) {
        storeMap[storeName] = {
          store: storeName,
          city: cityName,
          shifts: [],
          packages: 0,
          hours: 0,
          cancels: 0,
          pilotCancels: 0,
          clientCancels: 0,
          replacements: 0,
          confirmed: 0,
          attendedShifts: 0
        };
      }
      storeMap[storeName].shifts.push(s);
      storeMap[storeName].packages += pkgs;
      storeMap[storeName].hours += effectiveHours;
      if (cls.attended) storeMap[storeName].attendedShifts++;
      if (isPilotCancel) {
        storeMap[storeName].cancels++;
        storeMap[storeName].pilotCancels++;
      } else if (isClientCancel) {
        storeMap[storeName].cancels++;
        storeMap[storeName].clientCancels++;
      }
      if (isReplacement) storeMap[storeName].replacements++;
      if (isConfirmed) storeMap[storeName].confirmed++;

      if (!cityMap[cityName]) {
        cityMap[cityName] = {
          city: cityName,
          shifts: [],
          packages: 0,
          hours: 0,
          cancels: 0,
          pilotCancels: 0,
          clientCancels: 0,
          replacements: 0,
          confirmed: 0,
          attendedShifts: 0
        };
      }
      cityMap[cityName].shifts.push(s);
      cityMap[cityName].packages += pkgs;
      cityMap[cityName].hours += effectiveHours;
      if (cls.attended) cityMap[cityName].attendedShifts++;
      if (isPilotCancel) {
        cityMap[cityName].cancels++;
        cityMap[cityName].pilotCancels++;
      } else if (isClientCancel) {
        cityMap[cityName].cancels++;
        cityMap[cityName].clientCancels++;
      }
      if (isReplacement) cityMap[cityName].replacements++;
      if (isConfirmed) cityMap[cityName].confirmed++;
    });

    // Conciliación precisa de vacantes por tienda y ciudad usando reconcileShiftsMatch
    Object.values(storeMap).forEach(st => {
      const matchRes = typeof reconcileShiftsMatch === 'function' ? reconcileShiftsMatch(st.shifts) : null;
      st.unmatchedCancels = matchRes ? matchRes.totalUnmatchedCancels : Math.max(0, st.cancels - st.replacements);
      st.scheduled = matchRes ? matchRes.totalSlotsRequired : (st.confirmed + st.cancels);
      st.covered = matchRes ? matchRes.totalSlotsCovered : (st.confirmed + st.replacements);
      st.coveragePct = st.scheduled > 0 ? (st.covered / st.scheduled) * 100 : 100;
      st.productivity = st.hours > 0 ? (st.packages / st.hours) : 0;
    });

    Object.values(cityMap).forEach(ct => {
      const matchRes = typeof reconcileShiftsMatch === 'function' ? reconcileShiftsMatch(ct.shifts) : null;
      ct.unmatchedCancels = matchRes ? matchRes.totalUnmatchedCancels : Math.max(0, ct.cancels - ct.replacements);
      ct.scheduled = matchRes ? matchRes.totalSlotsRequired : (ct.confirmed + ct.cancels);
      ct.covered = matchRes ? matchRes.totalSlotsCovered : (ct.confirmed + ct.replacements);
      ct.coveragePct = ct.scheduled > 0 ? (ct.covered / ct.scheduled) * 100 : 100;
      ct.productivity = ct.hours > 0 ? (ct.packages / ct.hours) : 0;
      const evalDenom = ct.attendedShifts + ct.pilotCancels;
      ct.cancelRate = evalDenom > 0 ? (ct.pilotCancels / evalDenom) * 100 : 0;
    });

    // 2. Evaluar reglas de Tienda
    Object.values(storeMap).forEach(st => {
      this.rules.forEach(rule => {
        if (rule.evaluate) {
          const evalRes = rule.evaluate(st);
          if (evalRes && evalRes.triggered) {
            alerts.push({
              id: `${rule.id}__store__${encodeURIComponent(st.store)}`,
              ruleId: rule.id,
              ruleName: rule.name,
              category: rule.category,
              priority: rule.priority,
              entityType: 'store',
              entityName: st.store,
              city: st.city,
              evidence: evalRes.evidence,
              recommendation: evalRes.recommendation,
              detectedAt: new Date().toISOString()
            });
          }
        }
      });
    });

    // 3. Agrupar por Piloto (canónicamente por pilot_id) y evaluar reglas de Piloto
    const pilotMap = {};
    filteredMalla.forEach(s => {
      const rawPilotId = s.pilot_id ? String(s.pilot_id).trim() : '';
      const cleanPilotId = (rawPilotId && rawPilotId !== '—' && rawPilotId !== '-' && rawPilotId.toLowerCase() !== 'null' && rawPilotId.toLowerCase() !== 'undefined')
        ? rawPilotId.toLowerCase()
        : null;
      const rawPilotName = String(s.pilot || s.pilot_name || '').trim();
      const cleanPilotName = (rawPilotName && rawPilotName !== '—' && rawPilotName !== '-' && !rawPilotName.toLowerCase().includes('vacante') && rawPilotName.toLowerCase() !== 'sin piloto')
        ? rawPilotName
        : null;

      if (!cleanPilotId && !cleanPilotName) return;
      const pilotKey = cleanPilotId || `NAME_${cleanPilotName.toLowerCase()}`;

      if (!pilotMap[pilotKey]) {
        pilotMap[pilotKey] = {
          pilot: cleanPilotName || cleanPilotId,
          pilotId: rawPilotId || null,
          store: s.store,
          city: s.city,
          scheduled: 0,
          attended: 0,
          cancels: 0,
          packages: 0,
          hours: 0
        };
      }

      const cls = typeof classifyShiftStatus === 'function'
        ? classifyShiftStatus(s.status)
        : { attended: false, pilotCancel: false, excluded: false };
      const isPilotCancel = typeof isOperationalPilotCancel === 'function'
        ? isOperationalPilotCancel(s)
        : Boolean(cls.pilotCancel);

      // Excluir eventos no imputables al piloto (Cliente Cancela, Tienda cerrada, Adicional no autorizado, Adicional Cancela)
      if (cls.excluded || cls.clientCancel) return;

      pilotMap[pilotKey].scheduled++;
      if (isPilotCancel) {
        pilotMap[pilotKey].cancels++;
      } else if (cls.attended) {
        const rawH = Number(s.hours || 0);
        const effH = rawH > 0 ? rawH : 8;
        pilotMap[pilotKey].attended++;
        pilotMap[pilotKey].packages += Number(s.packages || 0);
        pilotMap[pilotKey].hours += effH;
      }
    });

    Object.values(pilotMap).forEach(p => {
      p.productivity = p.hours > 0 ? (p.packages / p.hours) : 0;
      p.attendancePct = p.scheduled > 0 ? (p.attended / p.scheduled) * 100 : 100;

      this.rules.forEach(rule => {
        if (rule.evaluatePilot) {
          const evalRes = rule.evaluatePilot(p);
          if (evalRes && evalRes.triggered) {
            alerts.push({
              id: `${rule.id}__pilot__${encodeURIComponent(p.pilot)}`,
              ruleId: rule.id,
              ruleName: rule.name,
              category: rule.category,
              priority: rule.priority,
              entityType: 'pilot',
              entityName: p.pilot,
              city: p.city,
              store: p.store,
              evidence: evalRes.evidence,
              recommendation: evalRes.recommendation,
              detectedAt: new Date().toISOString()
            });
          }
        }
      });
    });

    // Ordenar alertas por severidad: CRITICO -> ALTO -> PREVENTIVO -> INFORMATIVO -> POSITIVO
    const priorityWeight = { 'CRITICO': 4, 'ALTO': 3, 'PREVENTIVO': 2, 'INFORMATIVO': 1, 'POSITIVO': 0 };
    alerts.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));

    return {
      alerts,
      alertsCount: alerts.length,
      storeStats: storeMap,
      pilotStats: pilotMap,
      cityStats: cityMap,
      criticalCount: alerts.filter(a => a.priority === 'CRITICO').length,
      highCount: alerts.filter(a => a.priority === 'ALTO').length,
      positiveCount: alerts.filter(a => a.priority === 'POSITIVO').length
    };
  }
};
