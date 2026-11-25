// ============================================================
// AUDITOR DE CALIDAD DE DATOS — PIBOX TADA
// Detecta inconsistencias, duplicados y anomalías en registros
// sin modificar ni eliminar ningún dato original.
// ============================================================

const DataQualityAuditor = {
  /**
   * Ejecuta auditoría no intrusiva sobre un conjunto de turnos
   * @param {Array} shifts
   * @returns {Object} Resumen y hallazgos categorizados
   */
  auditShifts(shifts) {
    const list = Array.isArray(shifts) ? shifts : [];
    const findings = [];

    if (list.length === 0) {
      return {
        auditedCount: 0,
        totalIssues: 0,
        summary: { errors: 0, anomalies: 0, inconsistencies: 0, warnings: 0 },
        findings: []
      };
    }

    // 1. Duplicados exactos por llave operativa
    const seenKeys = new Map();
    let duplicateCount = 0;
    const duplicateSamples = [];

    // 2. Turnos cancelados con paquetes > 0
    let cancelledWithPackagesCount = 0;
    const cancelledWithPackagesSamples = [];

    // 3. Variantes ortográficas de estados
    const statusVariants = new Map();

    // 4. Campos críticos faltantes
    let missingFieldsCount = 0;
    const missingSamples = [];

    // 5. Tiendas únicas para validar metas de productividad
    const uniqueStores = new Set();

    list.forEach(s => {
      const date = String(s.date || '').trim();
      const store = String(s.store || '').trim();
      const city = String(s.city || '').trim();
      const status = String(s.status || '').trim();
      const pilotKey = String(s.pilot_id || s.pilot || '').trim();
      const start = s.start != null ? String(s.start) : '';

      if (store) uniqueStores.add(store);

      // Campos críticos faltantes
      if (!date || !store || !city || !status) {
        missingFieldsCount++;
        if (missingSamples.length < 5) {
          missingSamples.push(`${date || 'Sin fecha'} · ${store || 'Sin tienda'} · ${status || 'Sin estado'}`);
        }
      }

      // Duplicados exactos
      const dupKey = `${date}|${store.toLowerCase()}|${start}|${pilotKey.toLowerCase()}|${status.toLowerCase()}`;
      if (seenKeys.has(dupKey)) {
        duplicateCount++;
        if (duplicateSamples.length < 5) {
          duplicateSamples.push(`${date} · ${store} · ${pilotKey || 'Sin piloto'} (${status})`);
        }
      } else {
        seenKeys.set(dupKey, true);
      }

      // Cancelados con paquetes > 0
      const stLower = status.toLowerCase();
      const pkgs = Number(s.packages || 0);
      if (stLower.includes('cancel') && pkgs > 0) {
        cancelledWithPackagesCount++;
        if (cancelledWithPackagesSamples.length < 5) {
          cancelledWithPackagesSamples.push(`${date} · ${store} · ${status} (${pkgs} paq)`);
        }
      }

      // Variantes de estados
      if (status) {
        const normSt = stLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!statusVariants.has(normSt)) statusVariants.set(normSt, new Set());
        statusVariants.get(normSt).add(status);
      }
    });

    if (duplicateCount > 0) {
      findings.push({
        id: 'DQ-DUP-01',
        severity: 'Error',
        title: 'Registros Duplicados Exactos',
        count: duplicateCount,
        description: `Se detectaron ${duplicateCount} registros con idéntica fecha, tienda, hora de inicio, piloto y estado.`,
        samples: duplicateSamples
      });
    }

    if (cancelledWithPackagesCount > 0) {
      findings.push({
        id: 'DQ-ANOM-01',
        severity: 'Anomalía',
        title: 'Turnos Cancelados con Paquetes Reportados',
        count: cancelledWithPackagesCount,
        description: `Se encontraron ${cancelledWithPackagesCount} turnos en estado de cancelación que registran paquetes > 0.`,
        samples: cancelledWithPackagesSamples
      });
    }

    // Tiendas sin meta de productividad
    if (typeof findProductivityTargetExact === 'function' && typeof PRODUCTIVITY_TARGETS !== 'undefined' && PRODUCTIVITY_TARGETS.length > 0) {
      const storesWithoutTarget = [];
      uniqueStores.forEach(st => {
        if (findProductivityTargetExact(st, null, null) == null) {
          storesWithoutTarget.push(st);
        }
      });
      if (storesWithoutTarget.length > 0) {
        findings.push({
          id: 'DQ-WARN-01',
          severity: 'Advertencia',
          title: 'Tiendas sin Meta de Productividad Asignada',
          count: storesWithoutTarget.length,
          description: `${storesWithoutTarget.length} tienda(s) activa(s) no tienen meta parametrizada en la matriz de productividad.`,
          samples: storesWithoutTarget.slice(0, 6)
        });
      }
    }

    // Variantes ortográficas de un mismo estado
    const multiVariantGroups = [];
    statusVariants.forEach((setVals) => {
      if (setVals.size > 1) {
        multiVariantGroups.push(Array.from(setVals).join(' / '));
      }
    });
    if (multiVariantGroups.length > 0) {
      findings.push({
        id: 'DQ-INC-01',
        severity: 'Inconsistencia',
        title: 'Variantes Ortográficas en Estados de Turno',
        count: multiVariantGroups.length,
        description: 'Existen múltiples formas de escritura para el mismo estado operativo (normalizadas automáticamente en cálculo).',
        samples: multiVariantGroups.slice(0, 5)
      });
    }

    if (missingFieldsCount > 0) {
      findings.push({
        id: 'DQ-WARN-02',
        severity: 'Advertencia',
        title: 'Registros con Campos Críticos Incompletos',
        count: missingFieldsCount,
        description: `${missingFieldsCount} registros carecen de fecha, tienda, ciudad o estado.`,
        samples: missingSamples
      });
    }

    const summary = {
      errors: findings.filter(f => f.severity === 'Error').length,
      anomalies: findings.filter(f => f.severity === 'Anomalía').length,
      inconsistencies: findings.filter(f => f.severity === 'Inconsistencia').length,
      warnings: findings.filter(f => f.severity === 'Advertencia').length
    };

    return {
      auditedCount: list.length,
      totalIssues: findings.length,
      summary,
      findings
    };
  }
};

if (typeof window !== 'undefined') {
  window.DataQualityAuditor = DataQualityAuditor;
}
if (typeof global !== 'undefined') {
  global.DataQualityAuditor = DataQualityAuditor;
}
