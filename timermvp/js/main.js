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

async function cargarTimersMVP() {
    // Si no hay sala definida, no hacemos nada
    if (!SALA_ID) return;

    const URL_DATOS = `https://darkfelipow-dot.github.io/timermvp/data/${SALA_ID}.json`;

    try {
        console.log("Intentando descargar datos de la sala desde:", URL_DATOS);
        
        const respuesta = await fetch(`${URL_DATOS}?t=${Date.now()}`);
        
        // Si el archivo no existe en GitHub (Error 404), lanzamos un aviso controlado
        if (respuesta.status === 404) {
            alert(`La sala "${SALA_ID}" es nueva. Se usará la configuración por defecto hasta que presiones "¡LO MATÉ!" por primera vez.`);
            // Aquí llamamos a tu carga inicial clásica de MVPs vivos por defecto
            if (typeof fetchStaticData === "function") fetchStaticData(); 
            return;
        }

        if (!respuesta.ok) throw new Error("Error en la respuesta del servidor.");
        
        const estadosMVPs = await respuesta.json();
        console.log("Datos de la sala descargados con éxito:", estadosMVPs);
        
        // ¡AQUÍ ESTÁ LA CLAVE! Pasamos los datos descargados a tu función de renderizar
        // Nota: Asegúrate de que tu función 'renderMvps' acepte este objeto.
        if (typeof renderMvps === "function") {
            renderMvps(estadosMVPs); 
            alert(`¡Sala "${SALA_ID}" cargada con éxito!`);
        } else {
            console.error("La función renderMvps no está disponible.");
        }

    } catch (error) {
        console.error("Error detallado al cargar la sala:", error);
        alert("Hubo un problema al conectar con la sala. Revisa la consola.");
    }
}