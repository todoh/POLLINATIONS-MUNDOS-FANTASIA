/* Archivo: script.js */

// Función principal para iniciar la generación
async function generateWorld() {
    const prompt = document.getElementById('userPrompt').value;
    if (!prompt) return alert("Por favor, describe tu mundo primero.");

    // UI Updates
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('generateBtn').disabled = true;

    try {
        // 1. Construir el prompt de sistema para forzar JSON
        const systemPrompt = `
            Eres un arquitecto de mundos de fantasía experto (Worldbuilder AI).
            TU TAREA: Generar un mundo basado en el input del usuario.
            FORMATO DE RESPUESTA: Debes devolver SOLAMENTE un objeto JSON válido.
            No uses bloques de código markdown (\`\`\`). Solo el JSON raw.
            
            Estructura del JSON requerida:
            {
                "characters": [
                    {"name": "Nombre", "role": "Rol/Clase", "appearance": "Descripción visual para generar imagen (inglés)", "description": "Breve biografía"}
                ],
                "locations": [
                    {"name": "Nombre Lugar", "visual_style": "Descripción visual para generar imagen (inglés)", "description": "Descripción del lugar"}
                ],
                "timeline": [
                    {"year": "Año/Era", "event": "Evento ocurrido"}
                ],
                "chapters": [
                    {"title": "Título Cap 1", "content": "Texto completo del capítulo..."},
                    {"title": "Título Cap 2", "content": "Texto completo del capítulo..."},
                    {"title": "Título Cap 3", "content": "Texto completo del capítulo..."},
                    {"title": "Título Cap 4", "content": "Texto completo del capítulo..."},
                    {"title": "Título Cap 5", "content": "Texto completo del capítulo..."}
                ]
            }

            INPUT DEL USUARIO: "${prompt}"
            
            Asegúrate de que la historia tenga coherencia y use los personajes generados.
            Genera 5 capítulos.
            Idioma de salida: Español (salvo los campos 'appearance' y 'visual_style' que deben ser en Inglés para la API de imagen).
        `;

        // 2. Llamada a la API de Texto de Pollinations
        // Usamos POST para poder enviar un prompt más largo y complejo
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt }
                ],
                model: 'openai', // O 'mistral' si prefieres, openai suele seguir mejor instrucciones JSON complejas
                json: true
            })
        });

        const textData = await response.text();
        
        // 3. Limpieza y Parseo del JSON
        // A veces las IAs ponen texto antes o después del JSON, intentamos extraerlo.
        let jsonStr = textData;
        // Eliminar bloques de código si la IA desobedece y los pone
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');
        
        // Intentar encontrar el primer '{' y el último '}'
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const worldData = JSON.parse(jsonStr);

        // 4. Renderizar datos
        renderCharacters(worldData.characters);
        renderLocations(worldData.locations);
        renderTimeline(worldData.timeline);
        renderStory(worldData.chapters);

        // UI Show
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('resultArea').classList.remove('hidden');

    } catch (error) {
        console.error(error);
        alert("Hubo un error al generar el mundo. La IA a veces se confunde con el formato JSON. Por favor intenta de nuevo.");
        document.getElementById('loading').classList.add('hidden');
    } finally {
        document.getElementById('generateBtn').disabled = false;
    }
}

// Renderizadores

function renderCharacters(chars) {
    const container = document.getElementById('charList');
    container.innerHTML = '';

    chars.forEach(char => {
        // Generar URL de imagen usando Pollinations Image API
        // encodeURIComponent es vital para pasar el prompt por URL
        const imgPrompt = `fantasy character portrait, ${char.appearance}, detailed, 8k, concept art`;
        const imgSrc = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=400&height=400&nologo=true&seed=${Math.floor(Math.random()*1000)}`;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${imgSrc}" class="card-img" alt="${char.name}" loading="lazy">
            <div class="card-content">
                <h3 class="card-title">${char.name}</h3>
                <div class="card-meta">${char.role}</div>
                <p>${char.description}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderLocations(locs) {
    const container = document.getElementById('locList');
    container.innerHTML = '';

    locs.forEach(loc => {
        const imgPrompt = `fantasy landscape, ${loc.visual_style}, epic, atmospheric, cinematic lighting`;
        const imgSrc = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=600&height=400&nologo=true&seed=${Math.floor(Math.random()*1000)}`;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${imgSrc}" class="card-img" alt="${loc.name}" loading="lazy">
            <div class="card-content">
                <h3 class="card-title">${loc.name}</h3>
                <p>${loc.description}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderTimeline(events) {
    const container = document.getElementById('timelineList');
    container.innerHTML = '';

    events.forEach(ev => {
        const item = document.createElement('li');
        item.className = 'timeline-item';
        item.innerHTML = `<span class="year">${ev.year}</span>: ${ev.event}`;
        container.appendChild(item);
    });
}

function renderStory(chapters) {
    const container = document.getElementById('storyContainer');
    container.innerHTML = '';

    chapters.forEach((cap, index) => {
        const div = document.createElement('div');
        div.className = 'chapter';
        div.innerHTML = `
            <h3>Capítulo ${index + 1}: ${cap.title}</h3>
            <p>${cap.content.replace(/\n/g, '<br>')}</p>
        `;
        container.appendChild(div);
    });
}

// Lógica de Tabs
function openTab(tabName) {
    // Esconder todo
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(c => c.classList.remove('active'));
    
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => b.classList.remove('active'));

    // Mostrar selección
    document.getElementById(tabName).classList.add('active');
    
    // Buscar el botón clickeado (hack simple buscando por onclick attribute o texto)
    // Para simplificar en este ejemplo, iteramos y activamos el que coincida
    btns.forEach(b => {
        if(b.getAttribute('onclick').includes(tabName)) {
            b.classList.add('active');
        }
    });
}
