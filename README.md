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

1.  Descarga e instala Node.js desde [nodejs.org](https://nodejs.org/).

2.  Abre una terminal y navega a la carpeta de tu proyecto.

3.  Ejecuta el siguiente comando para inicializar un nuevo proyecto Node.js:

    ```bash
    npm init -y
    ```

4.  Ejecuta el siguiente comando para instalar Express, body-parser, cors y fs:

    ```bash
    npm install express body-parser cors fs
    ```

### Configuración

1.  Crea un archivo llamado `update_stations.js` en la carpeta `js` de tu proyecto y agrega el siguiente código:

    ```javascript
    const express = require('express');
    const bodyParser = require('body-parser');
    const cors = require('cors');
    const fs = require('fs');

    const app = express();
    const port = 3000;

    // Configurar CORS para permitir solicitudes desde cualquier origen
    app.use(cors());

    // Configurar body-parser para analizar solicitudes JSON
    app.use(bodyParser.json());

    app.post('/update_stations', (req, res) => {
        const data = req.body;

        // Ruta al archivo stations.json
        const file = 'data/stations.json';

        // Leer el contenido actual del archivo
        fs.readFile(file, 'utf8', (err, fileData) => {
            if (err) {
                console.error('Error al leer el archivo stations.json:', err);
                return res.status(500).send('Error al leer el archivo stations.json');
            }

            try {
                // Convertir los datos del archivo a un objeto JSON
                const stations = JSON.parse(fileData);

                // Actualizar la información de las ciudades
                stations.reproductor.ciudades = data.reproductor.ciudades;

                // Convertir los datos actualizados a una cadena JSON
                const updatedData = JSON.stringify(stations, null, 4);

                // Escribir los datos actualizados en el archivo
                fs.writeFile(file, updatedData, 'utf8', (err) => {
                    if (err) {
                        console.error('Error al actualizar el archivo stations.json:', err);
                        return res.status(500).send('Error al actualizar el archivo stations.json');
                    }

                    console.log('Archivo stations.json actualizado correctamente');
                    res.send('Archivo stations.json actualizado correctamente');
                });
            } catch (err) {
                console.error('Error al analizar o escribir el archivo stations.json:', err);
                return res.status(500).send('Error al analizar o escribir el archivo stations.json');
            }
        });
    });

    app.listen(port, () => {
        console.log(`Servidor escuchando en el puerto ${port}`);
    });
    ```

2.  Modifica la función `saveCiudades()` en `js/crud.js` para que apunte al script del lado del servidor:

    ```javascript
    function saveCiudades() {
        $.ajax({
            url: 'http://localhost:3000/update_stations', // Cambiar la URL al script del lado del servidor
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ "reproductor": { "ciudades": ciudades } }), // Enviar los datos como una cadena JSON
            success: function(response) {
                console.log('Archivo stations.json actualizado correctamente');
                // Mostrar un mensaje de éxito al usuario
                alert('Cambios guardados correctamente');

                // Actualizar el localStorage
                updateLocalStorage();
            },
            error: function(xhr, status, error) {
                console.error('Error al actualizar el archivo stations.json:', error);
                // Mostrar un mensaje de error al usuario
                alert('Error al guardar los cambios: ' + error);
                // Imprimir información detallada sobre el error
                console.log('Código de estado:', xhr.status);
                console.log('Respuesta del servidor:', xhr.responseText);
            }
        });
    }
    ```

3.  En la terminal, ejecuta el siguiente comando para iniciar el servidor:

    ```bash
    node js/update_stations.js
    ```

El servidor ahora debería estar ejecutándose en `http://localhost:3000`.

### Uso

*   Para guardar los cambios de las ciudades, asegúrate de que el servidor esté ejecutándose y que las solicitudes se envíen a `http://localhost:3000/update_stations`.

## Personalización

*   Para agregar o modificar estaciones de radio, editar el archivo `data/stations.json`.
*   Para modificar los estilos de la página, editar el archivo `css/style.css`.
*   Para modificar la lógica de JavaScript, editar los archivos `js/theme.js` y `js/fullscreen.js`.

## Créditos

*   Este proyecto fue creado por [DiGiraldo].
*   Se utilizaron recursos de Bootstrap y Font Awesome.

## Licencia

Este proyecto está licenciado bajo la licencia [MIT License](LICENSE).
