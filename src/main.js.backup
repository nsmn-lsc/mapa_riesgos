import './style.css';
import L from 'leaflet';
import * as shapefile from 'shapefile';
import proj4 from 'proj4';

// Definir la proyección del shapefile (INEGI usa Lambert Conformal Conic para México)
// Esta es la proyección estándar de INEGI
proj4.defs("EPSG:6372", "+proj=lcc +lat_1=17.5 +lat_2=29.5 +lat_0=12 +lon_0=-102 +x_0=2500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

const map = L.map('map').setView([20.0911, -98.7624], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);

let estadoHidalgoLayer = null;
let municipiosLayer = null;

async function loadShapefile(shpUrl, dbfUrl) {
  try {
    console.log('Cargando shapefile desde:', shpUrl, dbfUrl);
    
    const geojson = {
      type: 'FeatureCollection',
      features: []
    };
    
    const source = await shapefile.open(shpUrl, dbfUrl);
    console.log('Archivos abiertos correctamente');
    
    let result = await source.read();
    while (!result.done) {
      if (result.value) {
        // Reproyectar las coordenadas de la geometría
        const reprojectedFeature = reprojectFeature(result.value);
        geojson.features.push(reprojectedFeature);
      }
      result = await source.read();
    }
    
    console.log('Features cargados:', geojson.features.length);
    if (geojson.features.length > 0) {
      console.log('Primer feature (reproyectado):', JSON.stringify(geojson.features[0].geometry.coordinates[0].slice(0, 3), null, 2));
    }
    
    return geojson;
  } catch (error) {
    console.error('Error cargando shapefile:', error);
    return null;
  }
}

function reprojectFeature(feature) {
  const reprojectCoords = (coords) => {
    if (typeof coords[0] === 'number') {
      // Es un punto [x, y]
      const [lng, lat] = proj4('EPSG:6372', 'WGS84', coords);
      return [lng, lat];
    } else {
      // Es un array de coordenadas
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

/**
 * Estilo para el contorno del estado de Hidalgo
 */
function styleEstado() {
  return {
    fillColor: '#e3f2fd',
    weight: 3,
    opacity: 1,
    color: '#1976d2',
    fillOpacity: 0.3
  };
}

/**
 * Estilo para los municipios
 */
function styleMunicipio(feature) {
  return {
    fillColor: '#ffffff',
    weight: 1.5,
    opacity: 1,
    color: '#424242',
    fillOpacity: 0.7
  };
}

/**
 * Resaltar municipio al pasar el mouse
 */
function highlightMunicipio(e) {
  const layer = e.target;
  layer.setStyle({
    weight: 3,
    color: '#ff5722',
    fillOpacity: 0.9
  });
  layer.bringToFront();
  
  // Mostrar nombre del municipio en el sidebar
  const props = layer.feature.properties;
  const infoDiv = document.getElementById('municipio-info');
  infoDiv.innerHTML = `
    <h3>${props.NOMGEO || props.NOM_MUN || 'Sin nombre'}</h3>
    <p><strong>Clave:</strong> ${props.CVEGEO || props.CVE_MUN || 'N/A'}</p>
    <p><strong>Entidad:</strong> ${props.CVE_ENT || 'N/A'}</p>
    <p class="placeholder-text">Haga clic para ver más información</p>
  `;
}

/**
 * Restaurar estilo del municipio
 */
function resetHighlightMunicipio(e) {
  if (municipiosLayer) {
    municipiosLayer.resetStyle(e.target);
  }
}

/**
 * Mostrar información completa al hacer clic en un municipio
 */
function clickMunicipio(e) {
  const props = e.target.feature.properties;
  const infoDiv = document.getElementById('municipio-info');
  infoDiv.innerHTML = `
    <h3>${props.NOMGEO || props.NOM_MUN || 'Sin nombre'}</h3>
    <p><strong>Clave:</strong> ${props.CVEGEO || props.CVE_MUN || 'N/A'}</p>
    <p><strong>Clave Entidad:</strong> ${props.CVE_ENT || 'N/A'}</p>
    <p><strong>Clave Municipio:</strong> ${props.CVE_MUN || 'N/A'}</p>
    <div style="margin-top: 1rem; padding: 0.75rem; background: #e3f2fd; border-radius: 4px;">
      <p style="margin: 0; font-size: 0.9rem;">
        <strong>Nivel de Riesgo:</strong> Pendiente de datos
      </p>
    </div>
  `;
}

/**
 * Asignar eventos de interacción a cada municipio
 */
function onEachMunicipio(feature, layer) {
  layer.on({
    mouseover: highlightMunicipio,
    mouseout: resetHighlightMunicipio,
    click: clickMunicipio
  });
}

/**
 * Carga el contorno del estado de Hidalgo
 */
async function cargarMapaBaseHidalgo() {
  console.log('📍 Cargando contorno del estado de Hidalgo...');
  
  try {
    const geojsonHidalgo = await loadShapefile(
      '/data/hidalgo_13ent/13ent.shp',
      '/data/hidalgo_13ent/13ent.dbf'
    );
    
    if (geojsonHidalgo && geojsonHidalgo.features.length > 0) {
      console.log('✓ Añadiendo contorno del estado al mapa...');
      
      estadoHidalgoLayer = L.geoJSON(geojsonHidalgo, {
        style: styleEstado
      }).addTo(map);
      
      const bounds = estadoHidalgoLayer.getBounds();
      map.fitBounds(bounds);
      
      console.log('✓ Contorno del estado cargado exitosamente');
    } else {
      console.error('✗ No se encontraron features en el shapefile');
    }
  } catch (error) {
    console.error('✗ Error al cargar contorno del estado:', error);
  }
/**
 * ========================================
 * INICIALIZACIÓN DE LA APLICACIÓN
 * ========================================
 */
console.log('🚀 Aplicación iniciada - Mapa de Riesgos de Hidalgo');

// Cargar capas en orden
async function inicializarMapa() {
  await cargarMapaBaseHidalgo();    // Primero el contorno del estado
  await cargarMunicipiosHidalgo();  // Luego los municipios
}

inicializarMapa
/**
 * Carga los municipios de Hidalgo (filtrados del shapefile nacional)
 */
async function cargarMunicipiosHidalgo() {
  console.log('📍 Cargando municipios de Hidalgo...');
  
  try {
    const geojsonMunicipios = await loadShapefile(
      '/data/muni_2018gw_hidalgo/muni_2018gw_hidalgo.shp',
      '/data/muni_2018gw_hidalgo/muni_2018gw_hidalgo.dbf'
    );
    
    if (geojsonMunicipios && geojsonMunicipios.features.length > 0) {
      console.log(`📊 Total de municipios en archivo: ${geojsonMunicipios.features.length}`);
      
      // Filtrar solo los municipios de Hidalgo (CVE_ENT = '13')
      const municipiosHidalgo = {
        type: 'FeatureCollection',
        features: geojsonMunicipios.features.filter(feature => {
          const cveEnt = feature.properties.CVE_ENT || feature.properties.CVEGEO?.substring(0, 2);
          return cveEnt === '13';
        })
      };
      
      console.log(`✓ Municipios de Hidalgo encontrados: ${municipiosHidalgo.features.length}`);
      
      if (municipiosHidalgo.features.length > 0) {
        // Remover capa anterior si existe
        if (municipiosLayer) {
          map.removeLayer(municipiosLayer);
        }
        
        // Añadir capa de municipios
        municipiosLayer = L.geoJSON(municipiosHidalgo, {
          style: styleMunicipio,
          onEachFeature: onEachMunicipio
        }).addTo(map);
        
        console.log('✓ Municipios de Hidalgo cargados exitosamente');
        
        // Mostrar nombres de algunos municipios en consola
        const nombresMunicipios = municipiosHidalgo.features.slice(0, 5).map(f => 
          f.properties.NOMGEO || f.properties.NOM_MUN
        );
        console.log('📋 Primeros municipios:', nombresMunicipios.join(', '), '...');
      } else {
        console.warn('⚠️ No se encontraron municipios de Hidalgo en el shapefile');
      }
    } else {
      console.error('✗ No se encontraron features en el shapefile de municipios');
    }
  } catch (error) {
    console.error('✗ Error al cargar municipios:', error);
  }
}

/**
 * ========================================
 * INICIALIZACIÓN DE LA APLICACIÓN
 * ========================================
 */
console.log('🚀 Aplicación iniciada - Mapa de Riesgos de Hidalgo');

// Cargar capas en orden
async function inicializarMapa() {
  await cargarMapaBaseHidalgo();    // Primero el contorno del estado
  await cargarMunicipiosHidalgo();  // Luego los municipios
}

inicializarMapa();

// Funcionalidad del botón para mostrar/ocultar sidebar
document.getElementById('toggleSidebar').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
});
