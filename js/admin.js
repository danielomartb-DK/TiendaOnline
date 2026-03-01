/**
 * JS/Admin.js - Lógica del Panel de Administración
 * Permite a los administradores subir nuevos productos con imágenes.
 */

document.addEventListener('DOMContentLoaded', () => {
    initAdminPanel();
});

function initAdminPanel() {
    // 1. Verificar Seguridad: Solo admin puede ver esto
    if (!window.novaAuth || !window.novaAuth.isAdmin()) {
        document.body.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-slate-100 text-center">
                <div class="bg-white p-8 rounded-xl shadow-lg border border-red-200">
                    <span class="material-symbols-outlined text-6xl text-red-500 mb-4 block">gpp_maybe</span>
                    <h1 class="text-2xl font-black text-slate-800 mb-2">Acceso Denegado</h1>
                    <p class="text-slate-500 mb-6">Esta área es exclusiva para cuentas de Administrador.</p>
                    <a href="index.html" class="bg-primary text-brand-blue font-bold px-6 py-2 rounded-lg hover:brightness-110 transition-all text-sm">Volver a la Tienda</a>
                </div>
            </div>
        `;
        return;
    }

    const form = document.getElementById('adminProductForm');
    const inputImagen = document.getElementById('prodImagen');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const btnSubmit = document.getElementById('btnSubmitProducto');
    const errorMsgDiv = document.getElementById('adminErrorMsg');
    const errorTextSpan = document.getElementById('adminErrorText');

    // 2. Mostrar nombre del archivo al seleccionarlo visualmente
    inputImagen.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            fileNameDisplay.textContent = e.target.files[0].name;
            fileNameDisplay.classList.add('text-primary');
        } else {
            fileNameDisplay.textContent = '';
        }
    });

    // 3. Manejar envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsgDiv.classList.add('hidden');

        const file = inputImagen.files[0];
        if (!file) {
            mostrarError('Por favor selecciona una imagen para el producto.');
            return;
        }

        // Bloquear UI
        const originalBtnText = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner"></span> Subiendo y Guardando...';

        try {
            // A. Subir imagen a Supabase Storage
            const urlImagenReales = await subirFotoProducto(file);

            // B. Crear objeto Producto para BD
            const nuevoProducto = {
                nombre: document.getElementById('prodNombre').value.trim(),
                precio: parseFloat(document.getElementById('prodPrecio').value),
                stock: parseInt(document.getElementById('prodStock').value),
                descripcion: document.getElementById('prodDesc').value.trim(),
                imagen_url: urlImagenReales,
                estado: true // Activo por defecto
            };

            // C. Insertar en tabla "producto"
            const productoInsertado = await crearProducto(nuevoProducto);

            // Éxito: Limpiar formulario y mostrar toast
            form.reset();
            fileNameDisplay.textContent = '';
            mostrarToast('¡Producto "' + productoInsertado.nombre + '" agregado con éxito!');

        } catch (error) {
            mostrarError(error.message || 'Ocurrió un error inesperado al publicar el producto.');
        } finally {
            // Desbloquear UI
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalBtnText;
        }
    });

    function mostrarError(mensaje) {
        errorTextSpan.textContent = mensaje;
        errorMsgDiv.classList.remove('hidden');
    }

    function mostrarToast(msg) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMessage');
        toastMsg.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
    }
}
