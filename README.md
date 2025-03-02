<div align="center">
  <img src="img/radio-ico.ico" alt="Map Player Icecast2" width="120" />
  <h1>Map Player Icecast2</h1>
  <p><strong>Visualizador geográfico de emisoras con servidor Icecast2</strong></p>
  <p>
    <a href="#características">Características</a> •
    <a href="#instalación">Instalación</a> •
    <a href="#uso">Uso</a> •
    <a href="#panel-de-administración">Administración</a> •
    <a href="#capturas">Capturas</a>
  </p>
</div>

## 📋 Descripción

**Map Player Icecast2** es una aplicación web interactiva que visualiza estaciones de radio que utilizan el servidor Icecast2 en un mapa geográfico de Colombia. Los usuarios pueden explorar emisoras por ubicación geográfica y reproducir transmisiones en vivo directamente desde el navegador.

## ✨ Características

- **Mapa interactivo**: Visualización geoespacial de estaciones de radio en un mapa SVG de Colombia
- **Reproductor integrado**: Reproducción directa de streams de audio Icecast2
- **Diseño adaptable**: Interfaz responsiva para diferentes dispositivos
- **Modo claro/oscuro**: Cambia entre temas visuales para mejor experiencia
- **Visualización de audio**: Representación gráfica de la señal de audio en tiempo real
- **Monitoreo de oyentes**: Visualización del número de oyentes activos por estación
- **Panel de administración**: Gestión completa de estaciones y configuración del sistema

## 🚀 Instalación

### Requisitos previos

- Servidor web (Apache, Nginx) o entorno de desarrollo local (Laragon, XAMPP)
- PHP 7.4 o superior
- Navegador web moderno

### Pasos de instalación

1. Clone el repositorio en su directorio web:
   ```bash
   git clone https://github.com/yourusername/map-player-icecast2.git
   ```

2. Configure su servidor web para apuntar al directorio del proyecto
   
3. Asegúrese de que los archivos JSON en `/data/` tengan permisos de escritura

## 🖥️ Uso

### Método 1: Acceso directo vía URL

Simplemente abra un navegador y vaya a la URL donde está instalada la aplicación:

```
http://localhost/map-player-icecast2/
```

### Método 2: Ejecución con archivos Batch

El proyecto incluye archivos batch para facilitar su ejecución en Windows:

#### Iniciar servidor local

Ejecute el archivo `start_server.bat` para iniciar un servidor PHP local:

1. Haga doble clic en el archivo `start_server.bat` en el directorio raíz del proyecto
2. Se abrirá una ventana de comando que iniciará un servidor PHP en `localhost:8000`
3. El navegador se abrirá automáticamente con la aplicación

```cmd
REM Este comando inicia un servidor PHP local en el puerto 8000
php -S localhost:8000
```

#### Visualizar estaciones

Ejecute el archivo `view_stations.bat` para ver la lista completa de estaciones en formato JSON:

1. Haga doble clic en el archivo `view_stations.bat`
2. Se mostrará el contenido del archivo `data/stations.json` en una ventana de comando

## ⚙️ Panel de Administración

El proyecto cuenta con un panel de administración accesible en:

```
http://localhost/map-player-icecast2/admin/
```

### Funcionalidades del panel:

- **Dashboard**: Estadísticas generales y monitoreo
- **Gestión de estaciones**: Agregar, editar y eliminar emisoras
- **Configuración**: Ajustes generales del reproductor
- **Respaldos**: Sistema de copias de seguridad automáticas
- **Estadísticas**: Reportes de uso y audiencia

### Acceso:

- **Usuario**: admin
- **Contraseña**: admin123

## 📷 Capturas

<div align="center">
  <table>
    <tr>
      <td align="center">
        <p><strong>Vista del mapa</strong></p>
        <img src="img/screenshots/map-view.jpg" alt="Vista del mapa" width="400"/>
      </td>
      <td align="center">
        <p><strong>Reproductor activo</strong></p>
        <img src="img/screenshots/player-active.jpg" alt="Reproductor activo" width="400"/>
      </td>
    </tr>
    <tr>
      <td align="center">
        <p><strong>Modo oscuro</strong></p>
        <img src="img/screenshots/dark-mode.jpg" alt="Modo oscuro" width="400"/>
      </td>
      <td align="center">
        <p><strong>Panel de administración</strong></p>
        <img src="img/screenshots/admin-panel.jpg" alt="Panel de administración" width="400"/>
      </td>
    </tr>
  </table>
</div>

## 🔧 Personalización

El sistema es altamente personalizable:

- **Agregar departamentos**: Edite el archivo SVG para agregar nuevas regiones
- **Estilos visuales**: Modifique las variables CSS en `css/style.css`
- **Configuraciones del player**: Ajuste parámetros en `data/stations.json`

## 📡 Tecnologías utilizadas

- HTML5, CSS3, JavaScript
- Bootstrap 5
- SVG interactivo
- Web Audio API
- PHP (backend para administración)
- Almacenamiento en archivos JSON

## 👥 Colaboradores

- Di Giraldo - Desarrollador principal

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">
  <p>
    Desarrollado con ❤️ por <a href="https://github.com/digiraldo">Di Giraldo</a>
  </p>
  <p>
    <a href="https://github.com/digiraldo/map-player-icecast2">GitHub</a> •
    <a href="mailto:contact@example.com">Contacto</a>
  </p>
</div>
