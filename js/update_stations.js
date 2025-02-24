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