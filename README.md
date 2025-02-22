#### FILE: README.md
# Webplayer Radio Colombia

Este proyecto es un webplayer de radio de Colombia que muestra un mapa de Colombia con estaciones de radio ubicadas en diferentes ciudades.

## Características

*   **Mapa de Colombia:** Muestra un mapa de Colombia en formato SVG.
*   **Estaciones de radio:** Permite ubicar estaciones de radio en diferentes ciudades del mapa.
*   **Reproducción de audio:** Permite reproducir audio de las estaciones de radio.
*   **Diseño adaptable:** Se adapta a diferentes tamaños de pantalla, incluyendo dispositivos móviles.
*   **Modo oscuro/claro:** Permite cambiar entre el modo oscuro y claro.
*   **Información de la estación:** Muestra información de la estación de radio en una tarjeta.
*   **Pantalla completa:** Permite ver el mapa en pantalla completa.

## Tecnologías utilizadas

*   HTML
*   CSS
*   JavaScript
*   Bootstrap
*   Font Awesome

## Estructura de archivos

*   `index.html`: Archivo principal que contiene la estructura HTML de la página.
*   `css/style.css`: Archivo que contiene los estilos CSS de la página.
*   `js/theme.js`: Archivo que contiene la lógica de JavaScript para el cambio de tema y la ubicación de la tarjeta de información.
*   `js/fullscreen.js`: Archivo que contiene la lógica de JavaScript para la pantalla completa.
*   `data/stations.json`: Archivo que contiene la información de las estaciones de radio.
*   `img/`: Carpeta que contiene las imágenes utilizadas en la página.

## Configuración

1.  Clonar el repositorio.
2.  Abrir el archivo `index.html` en un navegador web.

## Configuración del servidor backend con Node.js y Express

### Requisitos

- Node.js y npm (Node Package Manager)

### Instalación

1. Descarga e instala Node.js desde [nodejs.org](https://nodejs.org/).

2. Abre una terminal y navega a la carpeta de tu proyecto.

3. Ejecuta el siguiente comando para inicializar un nuevo proyecto Node.js:

    ```bash
    npm init -y
    ```

4. Ejecuta el siguiente comando para instalar Express:

    ```bash
    npm install express
    ```

### Configuración

1. Crea un archivo llamado `server.js` en la raíz de tu proyecto y agrega el siguiente código:

    ```javascript
    const express = require('express');
    const fs = require('fs');
    const path = require('path');
    const app = express();

    app.use(express.json());

    app.post('/guardar-station', (req, res) => {
        const updatedReproductor = req.body;

        fs.readFile(path.join(__dirname, 'data', 'stations.json'), 'utf8', (err, data) => {
            if (err) {
                console.error('Error al leer el archivo JSON:', err);
                return res.status(500).send('Error al leer el archivo JSON');
            }

            const stations = JSON.parse(data);
            stations.reproductor = updatedReproductor;

            fs.writeFile(path.join(__dirname, 'data', 'stations.json'), JSON.stringify(stations, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Error al escribir en el archivo JSON:', err);
                    return res.status(500).send('Error al escribir en el archivo JSON');
                }

                res.send({ message: 'Datos guardados correctamente' });
            });
        });
    });

    app.listen(3000, () => {
        console.log('Servidor escuchando en el puerto 3000');
    });
    ```

2. En la terminal, ejecuta el siguiente comando para iniciar el servidor:

    ```bash
    node server.js
    ```

El servidor ahora debería estar ejecutándose en `http://localhost:3000`.

### Uso

- Para guardar los cambios del formulario "Editar Información de la Estación", asegúrate de que el servidor esté ejecutándose y que las solicitudes se envíen a `http://localhost:3000/guardar-station`.

## Personalización

*   Para agregar o modificar estaciones de radio, editar el archivo `data/stations.json`.
*   Para modificar los estilos de la página, editar el archivo `css/style.css`.
*   Para modificar la lógica de JavaScript, editar los archivos `js/theme.js` y `js/fullscreen.js`.

## Créditos

*   Este proyecto fue creado por [DiGiraldo].
*   Se utilizaron recursos de Bootstrap y Font Awesome.

## Licencia

Este proyecto está licenciado bajo la licencia [MIT License](LICENSE).
