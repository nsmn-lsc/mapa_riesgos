import * as shapefile from 'shapefile';
import { readFileSync } from 'fs';

// Mapeo de nombres del shapefile a nombres normalizados (para casos especiales)
const mapaEspecialNombres = {
  'TLAHUELILPAN': 'TLAHUIELILPAN',
  'SANTIAGO TULANTEPEC DE LUGO GUERRERO': 'SANTIAGO TULANTEPEC DE L. G.'
};

function normalizarNombreMunicipio(nombre) {
  if (!nombre) return '';
  
  // Normalizar
  let nombreLimpio = nombre
    .toUpperCase()
    .trim()
    // Primero eliminar todos los caracteres de codificación incorrecta UTF-8
    // IMPORTANTE: Á mayuscula (Á) mal codificada viene como Ã, hay que reemplazarla ANTES que ñ
    .replace(/Ã¡/g, 'A')  // á mal codificada
    .replace(/Ã©/g, 'E')  // é mal codificada
    .replace(/Ã­/g, 'I')  // í mal codificada
    .replace(/Ã³/g, 'O')  // ó mal codificada
    .replace(/Ãº/g, 'U')  // ú mal codificada
    .replace(/Ã±/g, 'N')  // ñ mal codificada
    .replace(/Ã/g, 'A')  // Á mayúscula mal codificada (Ángeles)
    .replace(/Ã/g, 'E')  // É mayúscula mal codificada
    .replace(/Ã/g, 'I')  // Í mayúscula mal codificada
    .replace(/Ã/g, 'O')  // Ó mayúscula mal codificada
    .replace(/Ã/g, 'U')  // Ú mayúscula mal codificada
    .replace(/Ã/g, 'N')  // Ñ mayúscula mal codificada
    // Luego normalizar acentos correctos
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/Ñ/g, 'N')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ')
    // Normalizar "de", "del", "la", "el" para consistencia
    .replace(/\bDE\s+/g, 'DE ')
    .replace(/\bDEL\s+/g, 'DEL ')
    .replace(/\bLA\s+/g, 'LA ')
    .replace(/\bEL\s+/g, 'EL ');
  
  // Aplicar mapeos especiales para casos que tienen nombres diferentes
  if (mapaEspecialNombres[nombreLimpio]) {
    return mapaEspecialNombres[nombreLimpio];
  }
  
  return nombreLimpio;
}

async function comparar() {
  // Cargar shapefile
  const source = await shapefile.open(
    './public/data/muni_2018gw_hidalgo/muni_2018gw_hidalgo.shp',
    './public/data/muni_2018gw_hidalgo/muni_2018gw_hidalgo.dbf'
  );
  
  const municipiosShape = [];
  let result = await source.read();
  while (!result.done) {
    if (result.value && result.value.properties.CVE_ENT === '13') {
      const nombre = result.value.properties.NOM_MUN;
      municipiosShape.push({
        original: nombre,
        normalizado: normalizarNombreMunicipio(nombre)
      });
    }
    result = await source.read();
  }
  
  // Cargar CSV
  const csvContent = readFileSync('./public/data/Municipios por Jurisdicción.csv', 'latin1');
  const lines = csvContent.split('\n');
  const municipiosCSV = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(';');
    if (parts.length >= 2) {
      const municipio = parts[1].trim();
      if (municipio) {
        municipiosCSV.push({
          original: municipio,
          normalizado: normalizarNombreMunicipio(municipio)
        });
      }
    }
  }
  
  // Ordenar
  municipiosShape.sort((a, b) => a.normalizado.localeCompare(b.normalizado));
  municipiosCSV.sort((a, b) => a.normalizado.localeCompare(b.normalizado));
  
  console.log('\n=== COMPARACIÓN DE MUNICIPIOS ===\n');
  console.log(`Municipios en Shapefile: ${municipiosShape.length}`);
  console.log(`Municipios en CSV: ${municipiosCSV.length}\n`);
  
  // Crear sets para comparación
  const setCSV = new Set(municipiosCSV.map(m => m.normalizado));
  const setShape = new Set(municipiosShape.map(m => m.normalizado));
  
  console.log('❌ MUNICIPIOS EN SHAPEFILE NO ENCONTRADOS EN CSV:');
  console.log('═'.repeat(60));
  municipiosShape.forEach(m => {
    if (!setCSV.has(m.normalizado)) {
      console.log(`  Shape: "${m.original}"`);
      console.log(`    -> Normalizado: "${m.normalizado}"`);
      
      // Buscar similares en CSV
      const similares = municipiosCSV.filter(c => {
        const similarity = calcularSimilitud(m.normalizado, c.normalizado);
        return similarity > 0.7;
      });
      
      if (similares.length > 0) {
        console.log(`    Posibles coincidencias en CSV:`);
        similares.forEach(s => {
          console.log(`      - "${s.original}" (${s.normalizado})`);
        });
      }
      console.log('');
    }
  });
  
  console.log('\n❌ MUNICIPIOS EN CSV NO ENCONTRADOS EN SHAPEFILE:');
  console.log('═'.repeat(60));
  municipiosCSV.forEach(m => {
    if (!setShape.has(m.normalizado)) {
      console.log(`  CSV: "${m.original}"`);
      console.log(`    -> Normalizado: "${m.normalizado}"`);
      
      // Buscar similares en Shape
      const similares = municipiosShape.filter(s => {
        const similarity = calcularSimilitud(m.normalizado, s.normalizado);
        return similarity > 0.7;
      });
      
      if (similares.length > 0) {
        console.log(`    Posibles coincidencias en Shape:`);
        similares.forEach(s => {
          console.log(`      - "${s.original}" (${s.normalizado})`);
        });
      }
      console.log('');
    }
  });
  
  console.log('\n✓ COINCIDENCIAS EXACTAS:');
  console.log('═'.repeat(60));
  let coincidencias = 0;
  municipiosShape.forEach(m => {
    if (setCSV.has(m.normalizado)) {
      coincidencias++;
    }
  });
  console.log(`Total de coincidencias: ${coincidencias}/${municipiosShape.length}`);
}

function calcularSimilitud(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

comparar().catch(console.error);
