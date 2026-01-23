/**
 * Obtiene el color según el nivel de riesgo
 * @param {number} riesgo - Nivel de riesgo (0-10)
 * @returns {string} Color en formato hexadecimal
 */
export function getRiskColor(riesgo) {
  const riesgoNum = parseFloat(riesgo);
  if (isNaN(riesgoNum)) return '#9e9e9e'; // Gris - Sin datos
  if (riesgoNum >= 8) return '#d32f2f'; // Rojo - Alto
  if (riesgoNum >= 5) return '#f57c00'; // Naranja - Medio
  if (riesgoNum >= 3) return '#fbc02d'; // Amarillo - Bajo
  return '#388e3c'; // Verde - Muy bajo
}

/**
 * Obtiene la etiqueta del nivel de riesgo
 * @param {number} riesgo - Nivel de riesgo (0-10)
 * @returns {string} Etiqueta del riesgo
 */
export function getRiskLabel(riesgo) {
  const riesgoNum = parseFloat(riesgo);
  if (isNaN(riesgoNum)) return 'Sin datos';
  if (riesgoNum >= 8) return 'Alto';
  if (riesgoNum >= 5) return 'Medio';
  if (riesgoNum >= 3) return 'Bajo';
  return 'Muy bajo';
}
