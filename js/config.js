// ============================================================
// CONFIGURACIÓN CENTRALIZADA - DASHBOARD OPERATIVO TADA / PIBOX
// ============================================================

const DEFAULT_CONFIG = {
  // Umbrales de Efectividad de Asistencia (%)
  attendanceGreen: 95,
  attendanceYellow: 90,

  // Umbrales de Tasa de Cancelación (%)
  cancellationGreen: 5,
  cancellationYellow: 10,

  // Umbrales de Puntualidad (%)
  punctualityGreen: 90,
  punctualityYellow: 80,

  // Factor de Demanda: Umbral (% de referencia) por debajo del cual se alerta baja demanda
  demandLowThreshold: 70,

  // Tolerancia de llegada (minutos)
  punctualityToleranceMinutes: 0,

  // Pesos del Índice de Confiabilidad (Suma debe ser 100%)
  weights: {
    productivity: 35,
    attendance: 25,
    cancellation: 20,
    punctuality: 10,
    sla35: 10
  },

  // Umbral de Score de Confiabilidad (0 a 100)
  reliabilityScoreGreen: 85,
  reliabilityScoreYellow: 70,

  // Umbral calibrable de riesgo de cancelación preventivo (Módulo 2)
  // Si el piloto supera este % de cancelación en 3 semanas, se activa la alerta 🚨 Alto Riesgo
  riskCancelThreshold: 10,

  // Nuevos Rangos de Evaluación de Productividad por Turno (Match Compuesto)
  // 🟢 Productivo: > 95.0%
  // 🟡 Productividad Aceptable: 90.0% - 94.99%
  // 🟠 Productividad Baja: 75.0% - 89.99%
  // 🔴 Improductivo: < 74.99%
  prodThresholdProductive: 95.0,
  prodThresholdAcceptable: 90.0,
  prodThresholdLow: 75.0
};

// Cargar configuración de localStorage o usar defaults
function loadConfig() {
  try {
    const saved = localStorage.getItem('tada_dashboard_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        weights: { ...DEFAULT_CONFIG.weights, ...(parsed.weights || {}) }
      };
    }
  } catch (e) {
    console.warn('Error loading config from localStorage:', e);
  }
  return { ...DEFAULT_CONFIG, weights: { ...DEFAULT_CONFIG.weights } };
}

function saveConfig(cfg) {
  try {
    localStorage.setItem('tada_dashboard_config', JSON.stringify(cfg));
  } catch (e) {
    console.warn('Error saving config to localStorage:', e);
  }
}

let APP_CONFIG = loadConfig();
