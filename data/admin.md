# Funcionalidades del Panel de Administración

Implementar un Panel de Administración que tenga una interfaz centralizada para gestionar el mapa y las estaciones de radio. Su estructura estará organizada en las siguientes secciones:

## 1. Módulo de Configuración

- **Propósito**: Permite modificar los ajustes generales del reproductor de mapa.
- **Funcionalidades**:
  - Cambiar el nombre de la estación principal
  - Configurar la URL del host para todas las estaciones
  - Ajustar el tamaño de los círculos en el mapa (radio)
  - Establecer o cambiar el logo del reproductor
  - Acceder directamente al mapa para ver los cambios aplicados
  - **[NUEVO]** Previsualización en tiempo real de los cambios
  - **[NUEVO]** Personalización de colores para los círculos y textos
  - **[NUEVO]** Ajustes de visualización para el conteo de oyentes

## 2. Módulo de Estaciones

- **Propósito**: Administrar las estaciones de radio que aparecen en el mapa.
- **Funcionalidades**:
  - Ver y ordenar todas las estaciones existentes
  - Agregar nuevas estaciones con sus coordenadas en el mapa
  - Editar información de estaciones (nombre, frecuencia, URL)
  - Eliminar estaciones
  - Crear copias de seguridad de la configuración
  - **[NUEVO]** Verificación automática de estatus (online/offline)
  - **[NUEVO]** Herramienta de posicionamiento visual en mapa
  - **[NUEVO]** Duplicación rápida de estaciones existentes
  - **[NUEVO]** Importación masiva desde CSV/Excel

## 3. Módulo de Estadísticas y Monitoreo

- **Propósito**: Visualizar métricas y estado del sistema.
- **Funcionalidades**:
  - Dashboard con estadísticas generales
  - Contador de oyentes en tiempo real
  - Historial de conexiones y desconexiones
  - Listado de fuentes activas vs. configuradas
  - Alertas visuales para estaciones caídas
  - Exportación de datos estadísticos

## 4. Módulo de Respaldos y Mantenimiento

- **Propósito**: Mantener la integridad y seguridad del sistema.
- **Funcionalidades**:
  - Creación de copias de seguridad programadas
  - Restauración desde respaldos previos
  - Visualización de logs del sistema
  - Herramientas de diagnóstico para conexiones
  - Limpieza de archivos temporales

## Características adicionales

- **Interfaz responsiva**: Diseñada con Bootstrap para adaptarse a diferentes tamaños de pantalla
- **Iconografía intuitiva**: Uso de iconos de Font Awesome y Bootstrap Icons para mejorar la experiencia del usuario
- **Sistema de temas**: Compatible con el modo claro/oscuro del reproductor principal
- **Seguridad**: Los cambios requieren confirmación antes de guardarse permanentemente
- **Tour de bienvenida**: Asistente interactivo para nuevos administradores
- **Accesos rápidos**: Panel lateral con las acciones más frecuentes
- **Compatibilidad PWA**: Funcionamiento como aplicación web progresiva para acceso móvil
- **Notificaciones**: Sistema de alertas para eventos importantes del sistema

## Consideraciones técnicas

- El panel debe ser completamente independiente del reproductor principal para evitar conflictos
- Utilizar autenticación básica para proteger el acceso
- Implementar validación de datos tanto en frontend como backend
- Optimizar para rendimiento en conexiones lentas
- Mantener compatibilidad con navegadores modernos (últimas 2 versiones)

Este panel administrativo debe estar diseñado como una herramienta complementaria al reproductor principal, permitiendo realizar cambios en la configuración sin necesidad de modificar manualmente archivos JSON o código. Todo el código de funcionamiento se alojará dentro de una carpeta llamada `admin`, lo que simplifica la gestión para usuarios no técnicos.
