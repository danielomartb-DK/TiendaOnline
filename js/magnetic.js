/**
 * js/magnetic.js
 * Añade un efecto interactivo moderno "magnético" a todos los botones principales de la tienda.
 * Se activará el resplandor y la atracción dinámica basada en las posiciones del mouse.
 */

document.addEventListener('DOMContentLoaded', () => {

    // Función para suscribir un botón individual al efecto magnético
    const bindMagneticEffect = (el) => {
        // Evita re-inicializar el mismo botón
        if (el.dataset.magneticBound === 'true') return;
        el.dataset.magneticBound = 'true';

        // Estilos CSS inline garantizados para suavidad
        el.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.25s ease';

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();

            // Determinar coordenadas relativas al centro exacto del botón
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Factor magnético (distancia que se mueve).
            // A 0.15 se siente suave y no entorpece el clic.
            const moveX = x * 0.15;
            const moveY = y * 0.15;

            el.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`;

            // Sombra neón tech/futurista dependiente del color corporativo original del botón
            if (el.classList.contains('bg-cyan-500') || el.classList.contains('text-brand-blue') || document.documentElement.classList.contains('dark')) {
                // Glow azul/cyan característico de la tienda
                el.style.boxShadow = `0px 10px 25px -5px rgba(6, 182, 212, 0.4)`;
            } else {
                // Glow sutil para botones normales/neutros
                el.style.boxShadow = `0px 10px 20px -5px rgba(0, 0, 0, 0.2)`;
            }
        });

        el.addEventListener('mouseleave', () => {
            // Regreso elástico a la posición original
            el.style.transform = 'translate(0px, 0px) scale(1)';
            el.style.boxShadow = ''; // Libera el glow dinámico
        });
    };

    /**
     * Barreleta del DOM para cazar elementos de botón
     * Incluimos <button>, enlaces con aspecto de botón (ej. Tailwind class bg-primary, etc.)
     */
    const initMagneticButtons = () => {
        const query = 'button, .btn, a.bg-primary, a.bg-cyan-500, a.bg-slate-800, a.bg-red-500, input[type="submit"]';
        const iterables = document.querySelectorAll(query);
        iterables.forEach(bindMagneticEffect);
    };

    // 1. Desencadenar la inicialización nativa en elementos HTML iniciales
    initMagneticButtons();

    // 2. Observer Reactivo (MutationObserver) para afectar a tarjetas de Producto inyectadas por Supabase
    const observer = new MutationObserver((mutations) => {
        let requireRebind = false;
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                // Si JavaScript inyecta nuevos productos/tarjetas, debemos aplicarles el efecto
                requireRebind = true;
            }
        });

        if (requireRebind) {
            initMagneticButtons();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
