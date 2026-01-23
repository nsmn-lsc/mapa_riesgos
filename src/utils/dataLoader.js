import shp from 'shpjs';
import * as XLSX from 'xlsx';

/**
 * Carga un archivo shapefile desde una URL
 * @param {string} url - URL del archivo .zip con el shapefile
 * @returns {Promise<Object>} GeoJSON del shapefile
 */
export async function loadShapefile(url) {
  try {
    const geojson = await shp(url);
    return geojson;
  } catch (error) {
    console.error('Error cargando shapefile:', error);
    throw error;
  }
}

/**
 * Carga un archivo Excel y lo convierte a JSON
 * @param {string} url - URL del archivo Excel
 * @returns {Promise<Array>} Array de objetos con los datos
 */
export async function loadExcelData(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    return data;
  } catch (error) {
    console.error('Error cargando Excel:', error);
    throw error;
  }
}
