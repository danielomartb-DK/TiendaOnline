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
        if (isDark) {
            icon.textContent = 'light_mode';
            icon.classList.replace('text-slate-800', 'text-yellow-400');
            icon.classList.replace('hover:bg-slate-200', 'hover:bg-slate-700');
        } else {
            icon.textContent = 'dark_mode';
            icon.classList.replace('text-yellow-400', 'text-slate-800');
            icon.classList.replace('hover:bg-slate-700', 'hover:bg-slate-200');
        }
    });
}

// Escuchar cuado el documento cargue para inicializar los iconos en su estado correcto
document.addEventListener('DOMContentLoaded', () => {
    actualizarIconosTema();
});
