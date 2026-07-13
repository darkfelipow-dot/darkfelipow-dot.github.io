// Variables globales para la sesión actual
let SALA_ID = localStorage.getItem("mvp_sala_id") || "";
let GITHUB_TOKEN = localStorage.getItem("mvp_github_token") || "";

// Si ya existían datos guardados, los ponemos en los inputs al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    if(SALA_ID) document.getElementById("input-sala-id").value = SALA_ID;
    if(GITHUB_TOKEN) document.getElementById("input-github-token").value = GITHUB_TOKEN;
    
    // Si ya hay una sala definida de antes, cargamos los tiempos automáticamente
    if(SALA_ID) cargarTimersMVP();
});

// Configurar el botón Conectar
document.getElementById("btn-conectar").addEventListener("click", () => {
    SALA_ID = document.getElementById("input-sala-id").value.trim();
    GITHUB_TOKEN = document.getElementById("input-github-token").value.trim();
    
    // Guardar localmente
    localStorage.setItem("mvp_sala_id", SALA_ID);
    localStorage.setItem("mvp_github_token", GITHUB_TOKEN);
    
    if (SALA_ID) {
        cargarTimersMVP();
    } else {
        alert("Por favor, ingresa al menos un ID de Sala.");
    }
});