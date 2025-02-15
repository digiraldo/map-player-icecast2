document.getElementById('fullscreenButton').addEventListener('click', function() {
    const element = document.documentElement; //documentElement es el elemento raíz del documento (el elemento <html>).

    if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) { /* Firefox */
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { /* IE/Edge */
            element.msRequestFullscreen();
        }
        document.querySelector("#fullscreenButton i").classList.remove('fa-expand');
        document.querySelector("#fullscreenButton i").classList.add('fa-compress');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
        document.querySelector("#fullscreenButton i").classList.remove('fa-compress');
        document.querySelector("#fullscreenButton i").classList.add('fa-expand');
    }
});