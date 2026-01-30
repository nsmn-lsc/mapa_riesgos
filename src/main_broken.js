import './style.css';
import L from 'leaflet';
import * as shapefile from 'shapefile';
import proj4 from 'proj4';

proj4.defs("EPSG:6372", "+proj=lcc +lat_1=17.5 +lat_2=29.5 +lat_0=12 +lon_0=-102 +x_0=2500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

const map = L.map('map').setView([20.0911, -98.7624], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);

let estadoHidalgoLayer = null;
let municipiosLayer = null;

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
    const bytes = new Uint8Array([...texto].map(char => char.charCodeAt(0)));
    const decoder = new TextDecoder('latin1');
    const latin1Text = decoder.decode(bytes);
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(latin1Text);
    const utf8Decoder = new TextDecoder('utf-8');
    return utf8Decoder.decode(utf8Bytes);
  } catch (error) {
    return texto;
  }
}

function styleEstado() {
  return {
    fill: false,
    weight: 4,
    opacity: 1,
    color: '#621132'
  };
}

function styleMunicipio() {
  const colors = ['#ffeb3b', '#ff9800', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffc107'];
  return {
    fillColor: colors[Math.floor(Math.random() * colors.length)],
    weight: 2,
    opacity: 1,
    color: '#000000',
    fillOpacity: 0.9
  };
}

function highlightMunicipio(e) {
  e.target.setStyle({ weight: 3, color: '#621132', fillOpacity: 0.9 });
  e.target.bringToFront();
  const props = e.target.feature.properties;
  const nombreMunicipio = decodificarTexto(props.NOM_MUN);
  document.getElementById('municipio-info').innerHTML = `<h3>${nombreMunicipio || 'Sin nombre'}</h3><p><strong>Clave:</strong> ${props.CVEGEO || 'N/A'}</p>`;
}

function resetHighlightMunicipio(e) {
  if (municipiosLayer) municipiosLayer.resetStyle(e.target);
}

function clickMunicipio(e) {
  const props = e.target.feature.properties;
  const nombreMunicipio = decodificarTexto(props.NOM_MUN);
  document.getElementById('municipio-info').innerHTML = `<h3>${nombreMunicipio || 'Sin nombre'}</h3><p><strong>Clave:</strong> ${props.CVEGEO || 'N/A'}</p><p><strong>CVE ENT:</strong> ${props.CVE_ENT || 'N/A'}</p>`;
}

function onEachMunicipio(feature, layer) {
  layer.on({ mouseover: highlightMunicipio, mouseout: resetHighlightMunicipio, click: clickMunicipio });
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
    
    if (geojson.features[0]) {
      console.log('📋 Propiedades disponibles:', Object.keys(geojson.features[0].properties));
      console.log('📋 Ejemplo de datos:', geojson.features[0].properties);
    }
    
    const hidalgo = { type: 'FeatureCollection', features: geojson.features.filter(f => f.properties.CVE_ENT === '13') };
    console.log(`✓ Municipios Hidalgo: ${hidalgo.features.length}`);
    if (hidalgo.features.length > 0) {
      municipiosLayer = L.geoJSON(hidalgo, { style: styleMunicipio, onEachFeature: onEachMunicipio }).addTo(map);
      if (estadoHidalgoLayer) estadoHidalgoLayer.bringToFront();
      console.log('✓ Municipios añadidos al mapa');
    }
  }
}

console.log('🚀 Aplicación iniciada');
(async () => { await cargarMapaBaseHidalgo(); await cargarMunicipiosHidalgo(); })();
document.getElementById('toggleSidebar').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('collapsed'));
