// Autor: Di Giraldo

document.addEventListener('DOMContentLoaded', () => {
    // Cachear elementos del DOM
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    const infoCard = document.getElementById('infoCard');
    const stationLogo = document.getElementById('stationLogo');
    const stationName = document.getElementById('stationName');
    const developerLink = document.getElementById('developerLink');
    const themeButton = document.getElementById('themeButton');

    // Función para cambiar el tema
    function setTheme(theme) {
        body.classList.add('theme-transition');

        // Actualizar el atributo data-theme
        body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Actualizar el icono del tema
        requestAnimationFrame(() => {
            if (theme === 'dark') {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        });

        // Eliminar la clase de transición después de un tiempo
        setTimeout(() => {
            body.classList.remove('theme-transition');
        }, 500);
    }

    // Obtener el tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Configurar el botón de tema
    themeButton.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // Cargar datos del archivo JSON
    fetch('data/stations.json')
        .then(response => response.json())
        .then(data => {
            const reproductor = data.reproductor;

            // Actualizar la tarjeta con la información
            stationLogo.src = reproductor.url_logo;
            stationName.textContent = reproductor.estacion;
            developerLink.href = `https://github.com/${reproductor.desarrollador}`;

            // Función para determinar la ubicación de la tarjeta
            function setInfoCardPosition() {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const cardWidth = infoCard.offsetWidth;
                const cardHeight = infoCard.offsetHeight;
                const margin = 20;

                let left, top;
                let isSmallScreen = screenWidth <= 768;

                if (!isSmallScreen) {
                    left = margin;
                    top = margin;
                    infoCard.classList.remove('small-card');
                } else {
                    left = screenWidth - cardWidth - margin;
                    top = margin;
                    infoCard.classList.add('small-card');
                }

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