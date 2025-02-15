// Autor: Di Giraldo

document.addEventListener('DOMContentLoaded', () => {
    // Función para cambiar el tema
    function setTheme(theme) {
        const body = document.body;
        body.classList.add('theme-transition'); // Agregar clase para la transición

        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        const themeIcon = document.getElementById('themeIcon');
        if (theme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }

        // Eliminar la clase de transición después de un tiempo
        setTimeout(() => {
            body.classList.remove('theme-transition');
        }, 500); // Duración de la transición en milisegundos
    }

    // Obtener el tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Configurar el botón de tema
    const themeButton = document.getElementById('themeButton');
    themeButton.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // Cargar datos del archivo JSON
    fetch('data/stations.json')
        .then(response => response.json())
        .then(data => {
            const reproductor = data.reproductor;

            // Actualizar la tarjeta con la información
            const infoCard = document.getElementById('infoCard');
            const stationLogo = document.getElementById('stationLogo');
            const stationName = document.getElementById('stationName');
            const developerLink = document.getElementById('developerLink');

            stationLogo.src = reproductor.url_logo;
            stationName.textContent = reproductor.estacion;
            developerLink.href = `https://github.com/${reproductor.desarrollador}`;

            // Función para determinar la ubicación de la tarjeta
            function setInfoCardPosition() {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const cardWidth = infoCard.offsetWidth;
                const cardHeight = infoCard.offsetHeight;

                // Márgenes predeterminados
                const margin = 20;

                let left, top;

                // Ubicación en la esquina superior izquierda para pantallas grandes
                if (screenWidth > 768) {
                    left = margin;
                    top = margin;
                    infoCard.classList.remove('small-card'); // Remover la clase para pantallas pequeñas
                }
                // Ubicación en la parte superior derecha para pantallas pequeñas
                else {
                    left = screenWidth - cardWidth - margin;
                    top = margin;
                    infoCard.classList.add('small-card'); // Agregar la clase para pantallas pequeñas
                }

                // Aplicar estilos de ubicación
                infoCard.style.left = `${left}px`;
                infoCard.style.top = `${top}px`;
            }

            // Establecer la posición inicial
            setInfoCardPosition();

            // Actualizar la posición al cambiar el tamaño de la ventana
            window.addEventListener('resize', setInfoCardPosition);
        })
        .catch(error => console.error('Error al cargar el archivo JSON:', error));
});