// === CONFIGURACIÓN DE SUPABASE (tus datos) ===
const SUPABASE_URL = "https://hwswuwkynyixaonukeik.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3c3d1d2t5bnlpeGFvbnVrZWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMyNDEsImV4cCI6MjA3NzA3OTI0MX0.p-JX1WnSOSBJSIF2XwM5YkHqbfUeiJ8YjKOJkIaAPlw";
const CLAVE_SECRETA = "8745"; // clave numérica que usarás al subir

// === INICIALIZAR SUPABASE (solo para listar) ===
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === PROTEGER SUBIDA: tocar título 3 veces ===
let toques = 0;
document.getElementById('titulo').addEventListener('click', () => {
  toques++;
  if (toques === 3) {
    toques = 0;
    document.getElementById('uploadSection').style.display = 'block';
  }
});

// === SUBIR AUDIO CON PROGRESO REAL ===
document.getElementById('btnSubir').addEventListener('click', () => {
  const clave = document.getElementById('claveAdmin').value;
  const file = document.getElementById('audioFile').files[0];
  const msg = document.getElementById('mensaje');
  const progreso = document.getElementById('progreso');
  const barra = document.getElementById('barra');

  if (clave !== CLAVE_SECRETA) {
    msg.textContent = "Clave incorrecta";
    return;
  }
  if (!file) {
    msg.textContent = "Selecciona un archivo";
    return;
  }
  if (file.size > 16 * 1024 * 1024) {
    msg.textContent = "El archivo debe ser menor a 16 MB";
    return;
  }

  progreso.style.display = 'block';
  barra.style.width = '0%';
  msg.textContent = "Subiendo...";

  const extension = file.name.split('.').pop() || 'mp3';
  const nombre = `predicacion-${Date.now()}.${extension}`;
  const url = `${SUPABASE_URL}/storage/v1/object/audios/${encodeURIComponent(nombre)}`;

  const xhr = new XMLHttpRequest();

  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const porcentaje = Math.round((e.loaded / e.total) * 100);
      barra.style.width = `${porcentaje}%`;
      msg.textContent = `Subiendo... ${porcentaje}%`;
    }
  });

  xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      msg.textContent = "¡Subido con éxito!";
      progreso.style.display = 'none';
      document.getElementById('audioFile').value = '';
      cargarAudios();
    } else {
      msg.textContent = "Error al subir";
      progreso.style.display = 'none';
      console.error("Error:", xhr.status, xhr.responseText);
    }
  });

  xhr.open('POST', url);
  xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
  xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');
  xhr.send(file);
});

// === CARGAR Y MOSTRAR AUDIOS ===
async function cargarAudios() {
  const { data, error } = await supabase.storage.from('audios').list('', {
    sortBy: { column: 'name', order: 'desc' }
  });

  const contenedor = document.getElementById('audios');
  if (error) {
    contenedor.innerHTML = '<p>No se pudieron cargar las predicaciones.</p>';
    return;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p>No hay predicaciones aún.</p>';
    return;
  }

  contenedor.innerHTML = '';
  data.forEach(archivo => {
    const timestamp = archivo.name.match(/predicacion-(\d+)/)?.[1];
    const fecha = timestamp ? new Date(parseInt(timestamp)).toLocaleDateString('es-ES') : 'Sin fecha';
    const url = supabase.storage.from('audios').getPublicUrl(archivo.name).data.publicUrl;
    
    const div = document.createElement('div');
    div.className = 'audio-item';
    div.innerHTML = `
      <div class="audio-etiqueta">Predicación • ${fecha}</div>
      <audio controls src="${url}"></audio>
    `;
    contenedor.appendChild(div);
  });
}

// === INICIAR ===
cargarAudios();

// === REGISTRAR SERVICE WORKER ===
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
