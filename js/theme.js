/**
 * js/theme.js - Gestión del Modo Oscuro/Claro
 * Se ejecuta lo más pronto posible para evitar parpadeos blancos (FOUC)
 */

// Función anónima autoejecutable para inicializar el tema inmediatamente
(function () {
    const savedTheme = localStorage.getItem('PixelWear_theme');

    // Preferencia inicial: lo guardado, o si no hay, la preferencia del sistema operativo
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();

// Función global para que el botón la llame
window.toggleTheme = function () {
    const isDark = document.documentElement.classList.contains('dark');

    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('PixelWear_theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('PixelWear_theme', 'dark');
    }

    // Actualizar iconos si existen en la página activa
    actualizarIconosTema();
};

function actualizarIconosTema() {
    const isDark = document.documentElement.classList.contains('dark');
    const themeIcons = document.querySelectorAll('.theme-icon-toggle');

    themeIcons.forEach(icon => {
        // Remover clases de material symbols si la tienen para evitar colisión de tamaño
        icon.classList.remove('material-symbols-outlined');

        if (isDark) {
            // Modo Oscuro -> JinWoo
            icon.innerHTML = '<img src="assets/images/avatar_jinwoo.png" alt="JinWoo (Dark Mode)" class="w-9 h-9 rounded-full object-cover border-2 border-[#4f46e5] shadow-[0_0_12px_rgba(79,70,229,0.9)] pointer-events-none transition-all duration-300 group-hover:scale-110" />';
        } else {
            // Modo Claro -> Rengoku
            icon.innerHTML = '<img src="assets/images/avatar_rengoku.png" alt="Rengoku (Light Mode)" class="w-9 h-9 rounded-full object-cover border-2 border-[#f97316] shadow-[0_0_12px_rgba(249,115,22,0.9)] pointer-events-none transition-all duration-300 group-hover:scale-110" />';
        }
    });
}

// Escuchar cuado el documento cargue para inicializar los iconos en su estado correcto
document.addEventListener('DOMContentLoaded', () => {
    actualizarIconosTema();
});
