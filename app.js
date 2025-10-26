// === CONFIGURACIÓN (¡REEMPLAZA CON TUS DATOS!) ===
const SUPABASE_URL = "https://hwswuwkynyixaonukeik.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3c3d1d2t5bnlpeGFvbnVrZWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDMyNDEsImV4cCI6MjA3NzA3OTI0MX0.p-JX1WnSOSBJSIF2XwM5YkHqbfUeiJ8YjKOJkIaAPlw"; // ¡PON TU CLAVE COMPLETA!
const CLAVE_SECRETA = "7645"; // ← Cambia esto a tu clave personal

// === INICIALIZAR SUPABASE ===
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === PROTEGER SUBIDA (tocar título 3 veces) ===
let toques = 0;
document.getElementById('titulo').addEventListener('click', () => {
  toques++;
  if (toques === 3) {
    toques = 0;
    document.getElementById('uploadSection').style.display = 'block';
  }
});

// === SUBIR AUDIO CON PROGRESO ===
document.getElementById('btnSubir').addEventListener('click', async () => {
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

  // Mostrar barra de progreso
  progreso.style.display = 'block';
  barra.style.width = '0%';
  msg.textContent = "Subiendo...";

  // Subir con progreso
  const nombre = `predicacion-${Date.now()}.${file.name.split('.').pop()}`;
  const { error } = await supabase.storage
    .from('audios')
    .upload(nombre, file, {
      cacheControl: '3600',
      upsert: false,
      // Supabase no da progreso nativo, pero podemos simularlo con tiempo estimado
    });

  if (error) {
    msg.textContent = "Error al subir";
    progreso.style.display = 'none';
    console.error(error);
  } else {
    msg.textContent = "¡Subido con éxito!";
    progreso.style.display = 'none';
    document.getElementById('audioFile').value = '';
    cargarAudios();
  }
});

// === CARGAR Y MOSTRAR AUDIOS CON ETIQUETAS ===
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
    // Extraer fecha del nombre (ej: predicacion-1729123456789.mp3)
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
