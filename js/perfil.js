/**
 * JS/Perfil.js - Lógica de Gestión de Perfil de Usuario
 */

document.addEventListener('DOMContentLoaded', () => {
    initPerfil();
});

async function initPerfil() {
    let checkInterval = setInterval(async () => {
        if (window.novaAuth && !window.novaAuth._refreshing) {
            clearInterval(checkInterval);
            if (!window.novaAuth.user || !window.novaAuth.user.user) {
                window.location.href = 'login.html';
                return;
            }
            await cargarDatosPerfil();
            const form = document.getElementById('profileForm');
            if (form) form.addEventListener('submit', handleProfileUpdate);
        }
    }, 50);
}

async function cargarDatosPerfil() {
    const user = window.novaAuth.user.user;
    const email = user.email;
    const form = document.getElementById('profileForm');
    if (!form) return;

    try {
        const cliente = await obtenerClientePorEmail(email);

        // Prioridad 1: Datos de la tabla 'cliente'
        // Prioridad 2: Metadatos de Autenticación (Supabase Auth)
        const nombreSugerido = (cliente && cliente.nombres) ? cliente.nombres : (user.user_metadata && user.user_metadata.name) ? user.user_metadata.name : '';
        const apellidoSugerido = (cliente && cliente.apellidos) ? cliente.apellidos : '';

        // Si el cliente no existe pero hay nombre en Auth, intentamos separar apellidos
        let finalNombres = nombreSugerido;
        let finalApellidos = apellidoSugerido;
        if (!cliente && nombreSugerido && !apellidoSugerido) {
            const parts = nombreSugerido.trim().split(' ');
            if (parts.length > 1) {
                finalNombres = parts.slice(0, -1).join(' ');
                finalApellidos = parts[parts.length - 1];
            }
        }

        form.nombres.value = finalNombres;
        form.apellidos.value = finalApellidos;
        form.email.value = email;

        if (cliente) {
            if (form.documento) form.documento.value = cliente.documento || '';
            if (form.telefono) form.telefono.value = cliente.telefono || '';
            if (form.direccion) form.direccion.value = cliente.direccion || '';
            if (form.ciudad) form.ciudad.value = cliente.ciudad || '';
            if (form.pais) form.pais.value = cliente.pais || '';
            if (form.codigo_postal) form.codigo_postal.value = cliente.codigo_postal || '';
        }

        const profileAvatar = document.getElementById('profileAvatar');
        const avatarName = finalNombres + ' ' + finalApellidos;
        if (profileAvatar && avatarName.trim()) {
            profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=random&size=128`;
        }
    } catch (error) {
        console.error("Error cargando perfil:", error);
        mostrarToast("Error al cargar datos del perfil", "error");
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveProfile');
    const originalContent = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Guardando...';

    const formData = new FormData(e.target);
    const datos = {
        nombres: formData.get('nombres'),
        apellidos: formData.get('apellidos'),
        documento: formData.get('documento'),
        telefono: formData.get('telefono'),
        direccion: formData.get('direccion'),
        ciudad: formData.get('ciudad'),
        pais: formData.get('pais'),
        codigo_postal: formData.get('codigo_postal'),
        email: window.novaAuth.user.user.email
    };

    try {
        // La función registrarCliente en api.js se encarga de UPDATE si ya existe 
        // o INSERT si es nuevo, buscando por email.
        await registrarCliente(datos);

        mostrarToast("¡Perfil actualizado con éxito!");

        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar && datos.nombres) {
            profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(datos.nombres)}&background=random&size=128`;
        }
    } catch (error) {
        let msg = error.message;
        // Manejo amigable del error de esquema (PGRST204)
        if (msg.includes('PGRST204') || msg.includes('column') || msg.includes('cache')) {
            console.warn("Faltan columnas en la base de datos:", msg);

            // Intento de rescate: Enviar solo campos básicos garantizados
            try {
                const basicos = {
                    nombres: datos.nombres,
                    apellidos: datos.apellidos,
                    documento: datos.documento,
                    telefono: datos.telefono,
                    direccion: datos.direccion,
                    email: datos.email
                };
                await registrarCliente(basicos);
                mostrarToast("Cambios guardados.", "success");
                return;
            } catch (retryErr) {
                msg = retryErr.message;
            }
        }

        console.error("Error al actualizar perfil:", error);
        mostrarToast("Error al actualizar el perfil: " + msg, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

function mostrarToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const icon = toast.querySelector('.material-symbols-outlined');
    if (toastMsg) toastMsg.textContent = msg;
    if (type === 'error') {
        icon.textContent = 'error';
        icon.style.color = '#f44336';
    } else {
        icon.textContent = 'check_circle';
        icon.style.color = '#4caf50';
    }
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}
