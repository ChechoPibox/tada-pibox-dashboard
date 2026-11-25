// ============================================================
// DICCIONARIO CANÓNICO DE KPIS — PIBOX TADA
// Fuente única de verdad documental para módulos e IA.
// No altera fórmulas oficiales; estandariza definiciones,
// numeradores, denominadores, exclusiones e interpretación.
// ============================================================

const KPI_DICTIONARY = {
  asistencia: {
    id: 'asistencia',
    name: 'Efectividad de Asistencia',
    module: 'Módulo 1 (Tarjeta 1)',
    unit: '%',
    target: '≥ 95%',
    formula: '(Turnos Cubiertos / Turnos Requeridos) × 100',
    numerator: 'Turnos en estados cumplidos + reemplazos conciliados (Confirmado, Reemplazo, Adicional TaDa, Adicional Autorizado)',
    denominator: 'Turnos requeridos según conciliación de mallas (reconcileShiftsMatch)',
    inclusions: ['Confirmado', 'Reemplazo', 'Adicional TaDa', 'Adicional Autorizado'],
    exclusions: ['Tienda cerrada', 'Cliente Cancela', 'Adicional no autorizado', 'Adicional Cancela', 'No Programado'],
    source: 'rules.js → calculateModulo1Kpis() / reconcileShiftsMatch()',
    interpretation: 'Mide el cumplimiento efectivo de la demanda operativa programada tras conciliar cancelaciones y reemplazos.'
  },
  cancelacion: {
    id: 'cancelacion',
    name: 'Tasa de Cancelación (Piloto)',
    module: 'Módulo 1 (Tarjeta 2)',
    unit: '%',
    target: '≤ 5%',
    formula: '(Piloto Cancela / (Turnos Cumplidos + Piloto Cancela)) × 100',
    numerator: 'Turnos con estado "Piloto Cancela" (imputables al conductor)',
    denominator: 'Turnos Cumplidos (Confirmado, Reemplazo, Adicional TaDa, Adicional Autorizado) + Piloto Cancela',
    inclusions: ['Confirmado', 'Reemplazo', 'Adicional TaDa', 'Adicional Autorizado', 'Piloto Cancela'],
    exclusions: ['Cliente Cancela', 'Adicional Cancela / Cancelado', 'No Programado', 'Sin Piloto', 'Tienda cerrada', 'Adicional no autorizado'],
    source: 'rules.js → calculateModulo1Kpis()',
    interpretation: 'Mide exclusivamente la deserción atribuible al piloto. Excluye cancelaciones del cliente o turnos no autorizados para no distorsionar la confiabilidad de la flota.'
  },
  cobertura: {
    id: 'cobertura',
    name: 'Cobertura de Cupos',
    module: 'Módulo 1 (Tarjeta 3)',
    unit: '%',
    target: '≥ 95%',
    formula: '(Numerador 8 estados / Denominador 5 estados) × 100',
    numerator: 'Confirmados + Reemplazo + Adicional TaDa + Adicional Autorizados + Tienda Cerrada + Piloto Cancela + Cliente Cancela + Adicional Cancela',
    denominator: 'Confirmados + Reemplazo + Adicional TaDa + Adicional Autorizados + Tienda Cerrada',
    inclusions: ['Confirmado', 'Reemplazo', 'Adicional TaDa', 'Adicional Autorizado', 'Tienda cerrada', 'Piloto Cancela', 'Cliente Cancela', 'Adicional Cancela'],
    exclusions: ['Adicional no autorizado (excluido de numerador y denominador)'],
    source: 'rules.js → calculateModulo1Kpis()',
    interpretation: 'Refleja la proporción de cupos totales gestionados respecto a los cupos efectivos asistidos. Puede superar el 100% cuando existen cancelaciones cubiertas o adicionales. Nota: En Módulo 3 (Semanas), la cobertura mide cupos cubiertos vs requeridos (≤ 100%).'
  },
  cuposFaltantes: {
    id: 'cuposFaltantes',
    name: 'Cupos Faltantes (Vacantes)',
    module: 'Módulo 1 (Tarjeta 4)',
    unit: 'cupos',
    target: '0 vacantes',
    formula: 'Cancelaciones sin reemplazo + No Programado + Sin Piloto',
    numerator: 'Cancelaciones (Piloto o Cliente) que no tuvieron turno de Reemplazo emparejado en la misma tienda/fecha + registros No Programado + Sin Piloto',
    denominator: 'N/A (conteo absoluto)',
    inclusions: ['Piloto Cancela sin reemplazo', 'Cliente Cancela sin reemplazo', 'No Programado', 'Sin Piloto'],
    exclusions: ['Cancelaciones que sí recibieron reemplazo válido', 'Adicional Cancela'],
    source: 'rules.js → reconcileShiftsMatch()',
    interpretation: 'Representa los huecos operativos reales que quedaron sin conductor en tienda.'
  },
  puntualidad: {
    id: 'puntualidad',
    name: 'Puntualidad de Llegada',
    module: 'Módulo 1 (Tarjeta 5)',
    unit: '%',
    target: '≥ 90%',
    formula: '(Turnos Puntuales con Gabela / Turnos Evaluados con Hora Inicio y Llegada) × 100',
    numerator: 'Turnos donde hora_llegada ≤ hora_inicio + gabela normativa configurada',
    denominator: 'Turnos con marca válida tanto de hora programada (start) como de llegada real (arrival)',
    inclusions: ['Turnos con start y arrival numéricos válidos'],
    exclusions: ['Turnos sin hora de llegada registrada (cancelados, sin registro)'],
    source: 'rules.js → isShiftPunctualWithGabela()',
    interpretation: 'Evalúa el cumplimiento horario de llegada a tienda aplicando la tolerancia (gabela) definida en configuración.'
  },
  pilotosActivos: {
    id: 'pilotosActivos',
    name: 'Pilotos Activos',
    module: 'Módulo 1 (Tarjeta 6)',
    unit: 'pilotos',
    target: 'Universo único del período',
    formula: 'Conteo de pilot_id únicos normalizados (o nombre si no existe ID)',
    numerator: 'Identificadores únicos de conductores presentes en los turnos filtrados',
    denominator: 'N/A (conteo único)',
    inclusions: ['Registros con pilot_id o nombre válido'],
    exclusions: ['Registros "Sin Piloto", "Vacante" o vacíos'],
    source: 'rules.js → calculateModulo1Kpis()',
    interpretation: 'Evita duplicidad si un mismo piloto trabaja en múltiples tiendas o ciudades en el período.'
  },
  productividad: {
    id: 'productividad',
    name: 'Productividad de Flota',
    module: 'Módulo 1 (Tarjetas 7 y 8)',
    unit: 'paq/h',
    target: '≥ 1.50 paq/h (meta flota) · ≥ 1.20 paq/h (salud IA)',
    formula: 'Total Paquetes Válidos / (Turnos Válidos × 8 horas)',
    numerator: 'Suma de paquetes reales + cancelados de los 4 estados válidos',
    denominator: 'Cantidad de turnos en los 4 estados válidos multiplicada por 8 horas estándar por turno',
    inclusions: ['Confirmado', 'Reemplazo', 'Adicional TaDa', 'Adicional Autorizado'],
    exclusions: ['Cancelaciones, Tienda cerrada, Adicional no autorizado, No programado'],
    source: 'rules.js → calculateModulo1Kpis()',
    interpretation: 'Mide la eficiencia de entrega por hora operativa estándar (8h por turno). A nivel de tienda se contrasta contra la matriz PRODUCTIVITY_TARGETS (>95% Productivo, 90-94.99% Aceptable, 75-89.99% Baja, <75% Improductivo).'
  },
  distribucionSemanal: {
    id: 'distribucionSemanal',
    name: 'Clasificación Semanal de Pilotos',
    module: 'Módulo 1 (Tarjeta 9)',
    unit: '% / pilotos',
    target: 'Balance de carga por piloto',
    formula: 'Agrupación de pilotos por cantidad de turnos válidos en el período (1-2, 3-4, 5+)',
    numerator: 'Pilotos únicos en cada rango de turnos válidos',
    denominator: 'Total de pilotos con al menos 1 turno válido',
    inclusions: ['Confirmado', 'Reemplazo', 'Adicional TaDa', 'Adicional Autorizado'],
    exclusions: ['Turnos cancelados o excluidos'],
    source: 'rules.js → calculateModulo1Kpis()',
    interpretation: 'Permite identificar dependencia de pilotos frecuentes (5+ turnos) frente a flota ocasional (1-2 turnos).'
  },
  saludOperativa: {
    id: 'saludOperativa',
    name: 'Índice de Salud Operativa',
    module: 'Inteligencia Operativa',
    unit: 'pts (0-100)',
    target: '≥ 85 Saludable · 70-84 Alerta · < 70 Riesgo Crítico',
    formula: '0.40 × Score(Cobertura/95) + 0.30 × Score(100 - Cancelación×2.5) + 0.30 × Score(Productividad/1.20)',
    numerator: 'Promedio ponderado de los 3 pilares operativos',
    denominator: '100 puntos máximos',
    inclusions: ['Cobertura de Cupos', 'Tasa de Cancelación', 'Productividad de Flota'],
    exclusions: ['No incluye puntualidad en el índice compuesto actual'],
    source: 'operational-ai-analyst.js → generateExecutiveSummary()',
    interpretation: 'Indicador sintético de salud general del período filtrado.'
  },

  get(id) {
    return this[id] && typeof this[id] === 'object' ? this[id] : null;
  },

  getAll() {
    return Object.keys(this)
      .filter(k => typeof this[k] === 'object' && this[k] !== null && this[k].id)
      .map(k => this[k]);
  },

  explainCoverageDifference() {
    return 'La Cobertura de Cupos en Módulo 1 (Tarjeta 3) divide 8 estados gestionados entre 5 estados base asistidos (pudiendo superar el 100% cuando hay cancelaciones cubiertas o adicionales), mientras que Módulo 3 (Semanas) calcula cupos cubiertos sobre cupos requeridos (máximo 100%). Ambas métricas son complementarias y correctas en su contexto.';
  }
};

if (typeof window !== 'undefined') {
  window.KPI_DICTIONARY = KPI_DICTIONARY;
}
if (typeof global !== 'undefined') {
  global.KPI_DICTIONARY = KPI_DICTIONARY;
}
