let SALA_ID = localStorage.getItem("mvp_sala_id") || "";
let GITHUB_TOKEN = localStorage.getItem("mvp_github_token") || "";
document.getElementById("refresh-btn").addEventListener("click", () => {
    if (SALA_ID) {
        cargarTimersMVP();
    } else {
        // En lugar del texto de ejemplo, usamos la recarga real del navegador
        location.reload(); 
    }
});
    const searchInput = document.getElementById('search-input');
    const clockEl = document.getElementById('clock');

    // Modals & Buttons
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');

    // Data Modal
    const dataModal = document.getElementById('data-modal');
    const closeDataModal = document.getElementById('close-data-modal');
    const copyBtn = document.getElementById('copy-btn');
    const loadBtn = document.getElementById('load-btn');
    const dataArea = document.getElementById('data-area');
    const modalTitle = document.getElementById('modal-title');

    // Edit Time Modal
    const editModal = document.getElementById('edit-time-modal');
    const closeEditModal = document.getElementById('close-edit-modal');
    const saveTimeBtn = document.getElementById('save-time-btn');
    const editTimeInput = document.getElementById('edit-time-input');
    const editMvpName = document.getElementById('edit-mvp-name');
    const mvpMapImage = document.getElementById('mvp-map-image');
    const mapContainer = document.getElementById('map-container');
    const tombMarker = document.getElementById('tomb-marker');

    // Map Selection Modal
    const mapModal = document.getElementById('map-selection-modal');
    const closeMapModal = document.getElementById('close-map-modal');
    const mapGridContainer = document.getElementById('map-grid-container');

    let currentEditingId = null;
    let currentTombX = null;
    let currentTombY = null;

    let staticMvpData = [];
    let userTimers = {}; // Object to store { id: { time: timestamp, tomb: {x, y} } } OR legacy { id: timestamp }

    // Initialize
    init();

    async function init() {
        loadUserTimers();
        await fetchStaticData();

        // Timer loop
        setInterval(() => {
            updateClock();
            renderMvps();
        }, 1000);
    }

    // Click on map to set tomb
    if (mapContainer) {
        mapContainer.addEventListener('click', (e) => {
            const rect = mapContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Convert to percentage
            currentTombX = (x / rect.width) * 100;
            currentTombY = (y / rect.height) * 100;

            // Update Marker
            tombMarker.style.left = currentTombX + '%';
            tombMarker.style.top = currentTombY + '%';
            tombMarker.style.display = 'block';

            console.log(`Tomb set: ${currentTombX.toFixed(2)}%, ${currentTombY.toFixed(2)}%`);
        });
    }

    // Load timers from LocalStorage
    function loadUserTimers() {
        const stored = localStorage.getItem('mvp_timers');
        if (stored) {
            try {
                userTimers = JSON.parse(stored);
                // Migration check: if old format (just numbers), convert to object
                Object.keys(userTimers).forEach(key => {
                    if (typeof userTimers[key] === 'number') {
                        userTimers[key] = { time: userTimers[key], tomb: null };
                    }
                });
            } catch (e) {
                console.error('Error parsing local storage', e);
                userTimers = {};
            }
        }
    }

    // Save timers to LocalStorage
    function saveUserTimers() {
        localStorage.setItem('mvp_timers', JSON.stringify(userTimers));
        renderMvps();
    }

    // Fetch static MVP data (database)
    async function fetchStaticData() {
        try {
            const response = await fetch('data/mvps.json');
            staticMvpData = await response.json();
            renderMvps();
        } catch (error) {
            console.error('Error fetching MVPs:', error);
        }
    }

    function updateClock() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString();
    }

    // Render cards
    function renderMvps() {
		const grid = document.getElementById("mvp-grid") || document.querySelector(".grid") || document.getElementById("grid"); 
    
    if (!grid) {
        console.error("No se encontró el contenedor del grid en el HTML");
        return;
    }
        grid.innerHTML = '';
        const filter = searchInput.value.toLowerCase();
        const now = Date.now();

        const displayList = staticMvpData.filter(mvp => {
            // Logic:
            // 1. If it's a Master MVP (is_master: true), ALWAYS show it.
            // 2. If it's a Variant (spawn_group exists but !is_master):
            //    Only show if it has an ACTIVE timer (dead or soon).
            // 3. Normal MVP: Show always.

            if (mvp.is_master) return true;

            if (mvp.spawn_group && !mvp.is_master) {
                const timerData = userTimers[mvp.id];
                // Show only if there is data for this variant (it means it was killed)
                return !!timerData;
            }

            return true;
        }).map(mvp => {
            // Handle both object and legacy format
            const timerData = userTimers[mvp.id];
            const lastKilled = timerData ? (timerData.time || timerData) : null;

            let status = 'alive';
            let sortOrder = 3;
            let sortTime = 0;

            if (lastKilled) {
                const respawnMinMs = mvp.respawn_min * 60 * 1000;
                const respawnMaxMs = mvp.respawn_max * 60 * 1000;
                const minSpawn = lastKilled + respawnMinMs;
                const maxSpawn = lastKilled + respawnMaxMs;

                if (now < minSpawn) {
                    status = 'dead';
                    sortOrder = 1;
                    sortTime = minSpawn;
                } else if (now >= minSpawn && now < maxSpawn) {
                    status = 'soon';
                    sortOrder = 2;
                    sortTime = minSpawn;
                }
            }

            // Masters always sort to bottom if they have no active timer themselves (which they shouldn't)
            // But actually we want Masters to be visible to click.
            if (mvp.is_master) {
                // If variants are active, maybe move master?
                status = 'alive';
                sortOrder = 3;
            }

            return { ...mvp, status, lastKilled, sortOrder, sortTime };
        });

        displayList.sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            if (a.sortOrder === 1 || a.sortOrder === 2) return a.sortTime - b.sortTime;
            return a.name.localeCompare(b.name);
        });

        displayList.forEach(mvp => {
            if (!mvp.name.toLowerCase().includes(filter)) return;

            const card = document.createElement('div');
            card.className = 'mvp-card';

            const respawnMinMs = mvp.respawn_min * 60 * 1000;
            const respawnMaxMs = mvp.respawn_max * 60 * 1000;

            let statusText = 'VIVO';
            let timerText = '¡YA!';
            let statusClass = 'status-alive';

            // If Master, different text
            if (mvp.is_master) {
                statusText = 'DISPONIBLE';
                timerText = '---';
                statusClass = 'status-alive';
            } else if (mvp.lastKilled) {
                const killedAt = mvp.lastKilled;
                const minSpawn = killedAt + respawnMinMs;
                const maxSpawn = killedAt + respawnMaxMs;

                if (now < minSpawn) {
                    statusText = 'MUERTO';
                    statusClass = 'status-dead';
                    const diff = minSpawn - now;
                    timerText = msToTime(diff);
                } else if (now >= minSpawn && now < maxSpawn) {
                    statusText = 'EN VENTANA';
                    statusClass = 'status-soon';
                    const diff = now - minSpawn;
                    timerText = '+' + msToTime(diff);
                }
            }

            const imageId = mvp.sprite_id || mvp.id;
            const imageUrl = `https://static.divine-pride.net/images/mobs/png/${imageId}.png`;

            // Check for saved tomb
            const hasTomb = userTimers[mvp.id] && userTimers[mvp.id].tomb;
            const tombIcon = hasTomb ? '📍 ' : '';

            card.innerHTML = `
                <div class="mvp-header">
                    <img src="${imageUrl}" alt="${mvp.name}" class="mvp-image" onerror="this.style.display='none'">
                    <div class="mvp-info">
                        <div class="mvp-name">${tombIcon}${mvp.name}</div>
                        <div class="mvp-map">${mvp.map}</div>
                        ${mvp.lastKilled ?
                    `<div style="font-size:0.75rem; color:#aaa; margin-top:4px;">
                                Murió: ${new Date(mvp.lastKilled).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>` : ''}
                    </div>
                    ${!mvp.is_master ? `<button class="edit-btn" data-id="${mvp.id}" title="Editar hora" style="background:none; border:none; color:#666; cursor:pointer; font-size:1.5rem;">📅</button>` : ''}
                </div>
                <div class="mvp-status ${statusClass}">
                    ${statusText}
                </div>
                <div class="mvp-timer">${timerText}</div>
                <button class="kill-btn" data-id="${mvp.id}">${mvp.is_master ? '¡LO MATÉ!' : '¡LO MATÉ!'}</button>
                ${mvp.lastKilled ? `<button class="undo-btn" data-id="${mvp.id}" style="margin-top:5px; background:#444; font-size:0.8rem;">Reset</button>` : ''}
            `;

            // Events
            const killBtn = card.querySelector('.kill-btn');
            killBtn.addEventListener('click', () => {
                if (mvp.is_master) {
                    openMapSelectionModal(mvp.spawn_group);
                } else {
                    killMvp(mvp.id);
                }
            });

            if (!mvp.is_master) {
                const editBtn = card.querySelector('.edit-btn');
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const savedData = userTimers[mvp.id];
                    const savedTomb = savedData ? savedData.tomb : null;
                    openEditModal(mvp.id, mvp.name, mvp.lastKilled, mvp.map, savedTomb);
                });

                const undoBtn = card.querySelector('.undo-btn');
                if (undoBtn) {
                    undoBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        resetMvp(mvp.id);
                    });
                }
            }

            grid.appendChild(card);
        });
    }

    function openMapSelectionModal(spawnGroup) {
        // Find all variants for this group
        const variants = staticMvpData.filter(m => m.spawn_group === spawnGroup && !m.is_master);

        mapGridContainer.innerHTML = '';

        variants.forEach(variant => {
            const div = document.createElement('div');
            div.className = 'map-choice-card';

            // Map Image
            const mapImgUrl = `https://www.divine-pride.net/img/map/raw/${variant.map}`;

            // Format respawn min to hours/min text
            const hours = Math.floor(variant.respawn_min / 60);
            const mins = variant.respawn_min % 60;
            const timeText = (hours > 0 ? `${hours}h ` : '') + (mins > 0 ? `${mins}m` : '');

            div.innerHTML = `
                <img src="${mapImgUrl}" alt="${variant.map}">
                <div class="map-choice-name">${variant.map}</div>
                <div class="map-choice-timer">Respawn: ${timeText}</div>
            `;

            div.addEventListener('click', () => {
                killMvp(variant.id);
                mapModal.style.display = 'none';
            });

            mapGridContainer.appendChild(div);
        });

        mapModal.style.display = 'block';
    }

    function killMvp(id) {
        if (!confirm('¿Seguro que mataste a este MVP?')) return;
        userTimers[id] = {
            time: Date.now(),
            tomb: null
        };
        saveUserTimers();
    }

    function resetMvp(id) {
        delete userTimers[id];
        saveUserTimers();
    }

    function openEditModal(id, name, currentTimestamp, mapName, savedTomb) {
        currentEditingId = id;
        editMvpName.textContent = name;

        // Load Map Image
        const mapUrl = `https://www.divine-pride.net/img/map/raw/${mapName}`;
        mvpMapImage.src = mapUrl;

        // Reset Tomb Marker visual
        if (savedTomb) {
            currentTombX = savedTomb.x;
            currentTombY = savedTomb.y;
            tombMarker.style.left = currentTombX + '%';
            tombMarker.style.top = currentTombY + '%';
            tombMarker.style.display = 'block';
        } else {
            currentTombX = null;
            currentTombY = null;
            tombMarker.style.display = 'none';
        }

        const now = new Date();
        const dateObj = currentTimestamp ? new Date(currentTimestamp) : now;

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');

        editTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        editModal.style.display = 'block';
    }

    saveTimeBtn.addEventListener('click', () => {
        if (currentEditingId && editTimeInput.value) {
            const newTime = new Date(editTimeInput.value).getTime();
            if (!isNaN(newTime)) {

                userTimers[currentEditingId] = {
                    time: newTime,
                    tomb: (currentTombX !== null && currentTombY !== null) ? { x: currentTombX, y: currentTombY } : null
                };

                saveUserTimers();
                editModal.style.display = 'none';
            } else {
                alert('Fecha inválida');
            }
        }
    });

    function msToTime(duration) {
        let seconds = Math.floor((duration / 1000) % 60);
        let minutes = Math.floor((duration / (1000 * 60)) % 60);
        let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;

        return hours + ":" + minutes + ":" + seconds;
    }

    // --- Search & Refresh ---
document.getElementById("refresh-btn").addEventListener("click", () => {
    if (SALA_ID) {
        cargarTimersMVP();
    } else {
        // Tu función clásica de recarga local si no hay sala
    }
});
    searchInput.addEventListener('input', renderMvps);


    // --- Export / Import Logic ---

    // --- Export / Import Logic (Compressed) ---

    exportBtn.addEventListener('click', () => {
        // Compression Format: ID(36).Time(Sec,36).TombX(36).TombY(36)!...
        const parts = [];

        Object.entries(userTimers).forEach(([id, data]) => {
            const timeVal = (typeof data === 'object') ? data.time : data;
            const tombVal = (typeof data === 'object') ? data.tomb : null;

            // Encode ID and Time (Seconds precision is enough, saves chars)
            const id36 = parseInt(id).toString(36);
            const time36 = Math.floor(timeVal / 1000).toString(36);

            let entry = `${id36}.${time36}`;

            if (tombVal) {
                // Encode Tomb X,Y as integers (0-100)
                const tx36 = Math.floor(tombVal.x).toString(36);
                const ty36 = Math.floor(tombVal.y).toString(36);
                entry += `.${tx36}.${ty36}`;
            }

            parts.push(entry);
        });

        const compressedCode = parts.join('!'); // Separator

        modalTitle.textContent = 'Copiar Código de Timer (Compacto)';
        dataArea.value = compressedCode;
        copyBtn.style.display = 'block';
        loadBtn.style.display = 'none';
        dataModal.style.display = 'block';
        dataArea.select();
    });

    copyBtn.addEventListener('click', () => {
        dataArea.select();
        document.execCommand('copy');
        alert('¡Copiado!');
    });

    importBtn.addEventListener('click', () => {
        modalTitle.textContent = 'Pegar Código de Timer';
        dataArea.value = '';
        copyBtn.style.display = 'none';
        loadBtn.style.display = 'block';
        dataModal.style.display = 'block';
    });

    loadBtn.addEventListener('click', () => {
        const input = dataArea.value.trim();
        if (!input) return;

        try {
            let importedData = {};

            // Check for compressed format (dots and exclamation marks/no JSON brackets)
            if (input.includes('.') && !input.trim().startsWith('{') && !input.trim().startsWith('eyJ')) {
                // NEW COMPRESSED FORMAT
                const entries = input.split('!');
                entries.forEach(entry => {
                    const parts = entry.split('.');
                    if (parts.length >= 2) {
                        const id = parseInt(parts[0], 36);
                        const time = parseInt(parts[1], 36) * 1000;

                        let tomb = null;
                        if (parts.length >= 4) {
                            tomb = {
                                x: parseInt(parts[2], 36), // Already stored as integer (0-100)
                                y: parseInt(parts[3], 36)
                            };
                        }

                        importedData[id] = { time, tomb };
                    }
                });
            } else {
                // FALLBACK TO LEGACY
                const jsonString = atob(input);
                importedData = JSON.parse(jsonString);
            }

            if (Object.keys(importedData).length === 0 && input.length > 0) throw new Error("No data found");

            if (confirm('¿Esto reemplazará tus timers actuales. Continuar?')) {
                userTimers = importedData;
                saveUserTimers();
                alert('¡Importación completada!');
                dataModal.style.display = 'none';
            }

        } catch (e) {
            alert('Error: Código inválido.');
            console.error(e);
        }
    });

    // Close Modals
    closeDataModal.addEventListener('click', () => {
        dataModal.style.display = 'none';
    });
    closeEditModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });
    if (closeMapModal) {
        closeMapModal.addEventListener('click', () => {
            mapModal.style.display = 'none';
        });
    }

    window.onclick = (event) => {
        if (event.target == dataModal) dataModal.style.display = 'none';
        if (event.target == editModal) editModal.style.display = 'none';
        if (event.target == mapModal) mapModal.style.display = 'none';
    };

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