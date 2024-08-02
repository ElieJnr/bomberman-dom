function requestFullScreen() {
    let elem = document.documentElement;

    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    document.addEventListener('keypress', requestFullScreen);
});

function replaceImage(power) {
    let imageDiv = document.getElementById(power);
    imageDiv.innerHTML = `<img src="assets/${power}active.svg" alt=" ">`;
}

document.addEventListener('keypress', (event) => {
    if (event.key === 'e') {
        replaceImage('bomb');
    }
});