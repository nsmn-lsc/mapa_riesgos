# Mapa de Riesgos por Municipio

Aplicación web interactiva para visualizar y gestionar mapas de riesgos por municipio, construida con tecnologías web modernas.

## 📋 Descripción

Este proyecto proporciona una herramienta de visualización geográfica que permite identificar, analizar y mostrar diferentes niveles de riesgo por municipio mediante un mapa interactivo. La aplicación está diseñada para ser ligera, rápida y fácil de usar.

## 🚀 Tecnologías

- **[Vite](https://vitejs.dev/)** - Build tool y servidor de desarrollo ultrarrápido
- **[Vanilla JS / Svelte](https://svelte.dev/)** - Framework/librería para la interfaz de usuario
- **[Leaflet](https://leafletjs.com/)** - Librería de mapas interactivos de código abierto

## 📦 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn

## 🔧 Instalación



1. Instalar las dependencias:
```bash
npm install
```

## 🏃 Uso

### Modo Desarrollo

Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Build de Producción

Crear la versión optimizada para producción:
```bash
npm run build
```

### Vista Previa de Producción

Previsualizar el build de producción:
```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
mapa_riesgos/
├── public/          # Archivos estáticos
├── src/             # Código fuente
│   ├── assets/      # Recursos (imágenes, estilos, etc.)
│   ├── components/  # Componentes reutilizables
│   ├── utils/       # Funciones de utilidad
│   └── main.js      # Punto de entrada de la aplicación
├── index.html       # HTML principal
├── package.json     # Dependencias y scripts
└── vite.config.js   # Configuración de Vite
```

## 🗺️ Características

- Visualización interactiva de mapas con Leaflet
- Identificación de municipios con diferentes niveles de riesgo
- Interfaz responsive y moderna
- Carga rápida y rendimiento optimizado

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 👥 Autor

- LSC. Norel Sánchez Mejorada Nájera

## 📞 Contacto

Para preguntas o sugerencias, por favor abre un issue en el repositorio.
