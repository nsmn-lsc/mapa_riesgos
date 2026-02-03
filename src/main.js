import './style.css';
import L from 'leaflet';
import * as shapefile from 'shapefile';
import proj4 from 'proj4';

proj4.defs("EPSG:6372", "+proj=lcc +lat_1=17.5 +lat_2=29.5 +lat_0=12 +lon_0=-102 +x_0=2500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

const map = L.map('map').setView([20.0911, -98.7624], 8);

const riskModalElement = document.getElementById('risk-modal');
const riskModalOpenButton = document.getElementById('open-risk-modal');
const riskModalCloseButton = document.getElementById('risk-modal-close');
const riskModalBackdrop = document.querySelector('#risk-modal .risk-modal__backdrop');

const setRiskModalVisibility = (isOpen) => {
  if (!riskModalElement) return;
  riskModalElement.classList.toggle('open', isOpen);
  riskModalElement.setAttribute('aria-hidden', (!isOpen).toString());
  if (riskModalOpenButton) {
    riskModalOpenButton.setAttribute('aria-expanded', isOpen.toString());
  }
};

const openRiskModal = () => setRiskModalVisibility(true);
const closeRiskModal = () => setRiskModalVisibility(false);

if (riskModalOpenButton) {
  riskModalOpenButton.addEventListener('click', openRiskModal);
}

if (riskModalCloseButton) {
  riskModalCloseButton.addEventListener('click', closeRiskModal);
}

if (riskModalBackdrop) {
  riskModalBackdrop.addEventListener('click', closeRiskModal);
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && riskModalElement?.classList.contains('open')) {
    closeRiskModal();
  }
});

setRiskModalVisibility(false);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);

let estadoHidalgoLayer = null;
let municipiosLayer = null;
let jurisdiccionesData = {};
let riesgosMunicipales = {};

// Mapeo de nombres del shapefile a nombres normalizados (para casos especiales)
const mapaEspecialNombres = {
  'TLAHUELILPAN': 'TLAHUIELILPAN',
  'SANTIAGO TULANTEPEC DE LUGO GUERRERO': 'SANTIAGO TULANTEPEC DE L. G.'
};

const coloresPorJurisdiccion = {
  'TULA': '#FF6B6B',
  'TULANCINGO': '#4ECDC4',
  'PACHUCA': '#45B7D1',
  'HUEJUTLA': '#FFA07A',
  'MINERAL DE LA REFORMA': '#98D8C8',
  'TIZAYUCA': '#F7DC6F',
  'ACTOPAN': '#BB8FCE',
  'IXMIQUILPAN': '#85C1E2',
  'ZACUALTIPAN': '#F8B88B',
  'APAN': '#FAD7A0',
  'HUICHAPAN': '#AED6F1',
  'JACALA': '#D7BDE2'
};

async function loadShapefile(shpUrl, dbfUrl, needsReproj = true) {
  try {
    console.log('Cargando shapefile:', shpUrl, '- Necesita reproyección:', needsReproj);
    const geojson = { type: 'FeatureCollection', features: [] };
    const source = await shapefile.open(shpUrl, dbfUrl);
    
    let result = await source.read();
    while (!result.done) {
      if (result.value) {
        const feature = needsReproj ? reprojectFeature(result.value) : result.value;
        geojson.features.push(feature);
      }
      result = await source.read();
    }
    
    console.log('✓ Features cargados:', geojson.features.length);
    return geojson;
  } catch (error) {
    console.error('Error cargando shapefile:', error);
    return null;
  }
}

function reprojectFeature(feature) {
  const reprojectCoords = (coords) => {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = proj4('EPSG:6372', 'WGS84', coords);
      return [lng, lat];
    } else {
      return coords.map(reprojectCoords);
    }
  };
  
  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: reprojectCoords(feature.geometry.coordinates)
    }
  };
}

function decodificarTexto(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  try {
    // Los bytes UTF-8 fueron leídos como Latin-1, hay que reinterpretarlos
    const bytes = [];
    for (let i = 0; i < texto.length; i++) {
      bytes.push(texto.charCodeAt(i));
    }
    // Decodificar como UTF-8
    const decoder = new TextDecoder('utf-8');
    const resultado = decoder.decode(new Uint8Array(bytes));
    return resultado;
  } catch (error) {
    console.error('Error decodificando:', error);
    return texto;
  }
}

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

function styleEstado() {
  return {
    fill: false,
    weight: 4,
    opacity: 1,
    color: '#621132'
  };
}

function styleMunicipio(feature) {
  const nombreMunicipio = decodificarTexto(feature.properties.NOM_MUN);
  const nombreNormalizado = normalizarNombreMunicipio(nombreMunicipio);
  const jurisdiccionInfo = jurisdiccionesData[nombreNormalizado];
  
  if (!jurisdiccionInfo) {
    console.warn(`⚠️ Municipio sin jurisdicción: "${nombreMunicipio}" -> normalizado: "${nombreNormalizado}"`);
  }
  
  const colorClave = jurisdiccionInfo?.normalizado || null;
  const color = colorClave && coloresPorJurisdiccion[colorClave] ? coloresPorJurisdiccion[colorClave] : '#CCCCCC';
  
  return {
    fillColor: color,
    weight: 1,
    opacity: 0.8,
    color: '#666666',
    fillOpacity: 0.8
  };
}

function highlightMunicipio(e) {
  e.target.setStyle({ weight: 3, color: '#d4c19c', fillOpacity: 0.9 });
  e.target.bringToFront();
  const props = e.target.feature.properties;
  const nombreMunicipio = decodificarTexto(props.NOM_MUN);
  const nombreNormalizado = normalizarNombreMunicipio(nombreMunicipio);
  const infoJurisdiccion = jurisdiccionesData[nombreNormalizado];
  const jurisdiccion = infoJurisdiccion?.original || 'No asignada';
  const infoPanel = document.getElementById('municipio-info');
  if (infoPanel) {
    infoPanel.innerHTML = `<h3>${nombreMunicipio || 'Sin nombre'}</h3><p><strong>Jurisdicción:</strong> ${jurisdiccion}</p><p><strong>Clave:</strong> ${props.CVEGEO || 'N/A'}</p>`;
  }
}

function resetHighlightMunicipio(e) {
  if (municipiosLayer) municipiosLayer.resetStyle(e.target);
}

function clickMunicipio(e) {
  const props = e.target.feature.properties;
  const nombreMunicipio = decodificarTexto(props.NOM_MUN);
  const nombreNormalizado = normalizarNombreMunicipio(nombreMunicipio);
  const infoJurisdiccion = jurisdiccionesData[nombreNormalizado];
  const jurisdiccion = infoJurisdiccion?.original || 'No asignada';
  const infoPanel = document.getElementById('municipio-info');
  if (infoPanel) {
    infoPanel.innerHTML = `<h3>${nombreMunicipio || 'Sin nombre'}</h3><p><strong>Jurisdicción:</strong> ${jurisdiccion}</p><p><strong>Clave:</strong> ${props.CVEGEO || 'N/A'}</p><p><strong>CVE ENT:</strong> ${props.CVE_ENT || 'N/A'}</p>`;
  }
  const riesgoInfo = riesgosMunicipales[nombreNormalizado];
  actualizarPanelRiesgos(nombreMunicipio, jurisdiccion, riesgoInfo);
}

function onEachMunicipio(feature, layer) {
  const nombreMunicipio = decodificarTexto(feature.properties.NOM_MUN);
  layer.bindTooltip(nombreMunicipio, {
    permanent: false,
    direction: 'top',
    className: 'municipio-tooltip'
  });
  layer.on({ mouseover: highlightMunicipio, mouseout: resetHighlightMunicipio, click: clickMunicipio });
}

async function cargarJurisdicciones() {
  console.log('📍 Cargando jurisdicciones...');
  try {
    const response = await fetch('/data/Municipios por Jurisdicción.csv');
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder('latin1').decode(buffer);
    const lines = text.split(/\r?\n/);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(';');
      if (parts.length >= 2) {
        const jurisdiccionOriginal = parts[0].replace(/\s+/g, ' ').trim();
        const municipioOriginal = parts[1].replace(/\s+/g, ' ').trim();
        if (jurisdiccionOriginal && municipioOriginal) {
          const municipioNormalizado = normalizarNombreMunicipio(municipioOriginal);
          const jurisdiccionNormalizada = normalizarNombreMunicipio(jurisdiccionOriginal);
          jurisdiccionesData[municipioNormalizado] = {
            original: jurisdiccionOriginal,
            normalizado: jurisdiccionNormalizada
          };
          
          if (i <= 3) {
            console.log(`  CSV línea ${i}: "${municipioOriginal}" -> "${municipioNormalizado}" | Jurisdicción: "${jurisdiccionOriginal}" -> clave "${jurisdiccionNormalizada}"`);
          }
        }
      }
    }
    
    const totalMunicipios = Object.keys(jurisdiccionesData).length;
    const jurisdiccionesUnicas = [...new Set(Object.values(jurisdiccionesData).map(info => info.normalizado))];
    console.log('✓ Jurisdicciones cargadas:', totalMunicipios, 'municipios');
    console.log('📋 Jurisdicciones únicas normalizadas:', jurisdiccionesUnicas);
  } catch (error) {
    console.error('Error cargando jurisdicciones:', error);
  }
}

async function cargarRiesgosMunicipales() {
  console.log('📍 Cargando matriz de riesgos municipales...');
  try {
    const response = await fetch('/data/riesgos_municipiop.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    let totalRegistros = 0;
    Object.entries(data || {}).forEach(([jurisdiccionOriginal, municipios]) => {
      const jurisdiccionNormalizada = normalizarNombreMunicipio(jurisdiccionOriginal);
      Object.entries(municipios || {}).forEach(([municipioOriginal, valores]) => {
        const municipioNormalizado = normalizarNombreMunicipio(municipioOriginal);
        riesgosMunicipales[municipioNormalizado] = {
          ...valores,
          jurisdiccion: jurisdiccionOriginal,
          jurisdiccionNormalizada
        };
        totalRegistros++;
      });
    });
    console.log(`✓ Matriz de riesgos cargada: ${totalRegistros} municipios con dato`);
  } catch (error) {
    console.error('Error cargando riesgos municipales:', error);
  }
}

function actualizarPanelRiesgos(nombreMunicipio, jurisdiccion, riesgoInfo) {
  const panel = document.getElementById('risk-details');
  if (!panel) return;

  setRiskModalVisibility(true);

  if (!riesgoInfo) {
    panel.innerHTML = `<p class="placeholder-text">No se registran riesgos para ${nombreMunicipio}. Selecciona otro municipio para continuar.</p>`;
    return;
  }

  const riesgoDescripcion = riesgoInfo.riesgos ?? 'Sin descripción disponible.';
  const fuente = riesgoInfo.fuente || 'Base de riesgos municipales';

  panel.innerHTML = `
    <div class="risk-headline">
      <div>
        <p class="risk-label">Municipio</p>
        <h3>${nombreMunicipio}</h3>
      </div>
    </div>
    <div class="risk-meta">
      <p><strong>Jurisdicción:</strong> ${jurisdiccion}</p>
      <p><strong>Fuente:</strong> ${fuente}</p>
    </div>
    <div class="risk-text">${riesgoDescripcion}</div>
  `;
}

async function cargarMapaBaseHidalgo() {
  console.log('📍 Cargando contorno de Hidalgo...');
  const geojson = await loadShapefile('/data/hidalgo_13ent/13ent.shp', '/data/hidalgo_13ent/13ent.dbf', true);
  if (geojson?.features.length > 0) {
    estadoHidalgoLayer = L.geoJSON(geojson, { style: styleEstado, interactive: false }).addTo(map);
    map.fitBounds(estadoHidalgoLayer.getBounds());
    console.log('✓ Contorno cargado');
  }
}

async function cargarMunicipiosHidalgo() {
  console.log('📍 Cargando municipios...');
  const geojson = await loadShapefile('/data/muni_2018gw_hidalgo/muni_2018gw_hidalgo.shp', '/data/muni_2018gw_hidalgo/muni_2018gw_hidalgo.dbf', false);
  if (geojson?.features.length > 0) {
    console.log(`📊 Total municipios: ${geojson.features.length}`);
    
    const hidalgo = { type: 'FeatureCollection', features: geojson.features.filter(f => f.properties.CVE_ENT === '13') };
    console.log(`✓ Municipios Hidalgo: ${hidalgo.features.length}`);
    
    // Verificar coincidencias con jurisdicciones
    let coincidencias = 0;
    let sinJurisdiccion = [];
    hidalgo.features.forEach(f => {
      const nombreOriginal = decodificarTexto(f.properties.NOM_MUN);
      const nombreNormalizado = normalizarNombreMunicipio(nombreOriginal);
      if (jurisdiccionesData[nombreNormalizado]) {
        coincidencias++;
      } else {
        sinJurisdiccion.push(nombreOriginal);
      }
    });
    
    console.log(`✓ Municipios con jurisdicción asignada: ${coincidencias}/${hidalgo.features.length}`);
    if (sinJurisdiccion.length > 0) {
      console.warn('⚠️ Municipios sin jurisdicción:', sinJurisdiccion);
    }
    
    if (hidalgo.features.length > 0) {
      municipiosLayer = L.geoJSON(hidalgo, { style: styleMunicipio, onEachFeature: onEachMunicipio }).addTo(map);
      if (estadoHidalgoLayer) estadoHidalgoLayer.bringToFront();
      console.log('✓ Municipios añadidos al mapa');
    }
  }
}

console.log('🚀 Aplicación iniciada');
(async () => { 
  await cargarJurisdicciones();
  await cargarRiesgosMunicipales();
  await cargarMapaBaseHidalgo(); 
  await cargarMunicipiosHidalgo(); 
})();
