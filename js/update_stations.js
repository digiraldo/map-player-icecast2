const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Configurar CORS para permitir solicitudes desde cualquier origen
app.use(cors());

// Configurar body-parser para analizar solicitudes JSON
app.use(bodyParser.json());

// Servir archivos estáticos desde la carpeta raíz del proyecto
app.use(express.static(path.join(__dirname, '../')));

// Nueva ruta GET para la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

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

            // Actualizar la información del reproductor
            stations.reproductor.estacion = data.reproductor.estacion || stations.reproductor.estacion;
            stations.reproductor.hostUrl = data.reproductor.hostUrl || stations.reproductor.hostUrl;
            stations.reproductor.statusUrl = data.reproductor.statusUrl || stations.reproductor.statusUrl;
            stations.reproductor.total_estaciones = data.reproductor.total_estaciones || stations.reproductor.total_estaciones;
            stations.reproductor.genero = data.reproductor.genero || stations.reproductor.genero;
            stations.reproductor.r = data.reproductor.r || stations.reproductor.r;
            stations.reproductor.url_logo = data.reproductor.url_logo || stations.reproductor.url_logo;

            // Actualizar la información de las ciudades
            if (data.reproductor.ciudades && Array.isArray(data.reproductor.ciudades)) {
                data.reproductor.ciudades.forEach(newCity => {
                    const existingCityIndex = stations.reproductor.ciudades.findIndex(city => city.name === newCity.name);

                    if (existingCityIndex !== -1) {
                        // Si la ciudad ya existe, actualizar su información
                        stations.reproductor.ciudades[existingCityIndex] = {
                            ...stations.reproductor.ciudades[existingCityIndex],
                            ...newCity
                        };
                    } else {
                        // Si la ciudad no existe, agregarla a la lista
                        stations.reproductor.ciudades.push(newCity);
                    }
                });
            }

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