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
            icon.innerHTML = '<img src="assets/images/avatar_jinwoo.png" alt="JinWoo (Dark Mode)" class="w-full h-full rounded-full object-cover border-[3px] border-[#4f46e5] shadow-[0_0_20px_rgba(79,70,229,0.9)] pointer-events-none transition-transform duration-300 group-hover:scale-110" />';
        } else {
            // Modo Claro -> Rengoku
            icon.innerHTML = '<img src="assets/images/avatar_rengoku.png" alt="Rengoku (Light Mode)" class="w-full h-full rounded-full object-cover border-[3px] border-[#f97316] shadow-[0_0_20px_rgba(249,115,22,0.9)] pointer-events-none transition-transform duration-300 group-hover:scale-110" />';
        }
    });
}

// --- Motor Avanzado de Partículas para el Anime Theme Toggle ---
class ThemeParticleEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    emitFire() {
        // Fuego intenso, dinámico y orgánico subiendo por la izquierda
        if (Math.random() < 0.9) {
            this.particles.push({
                type: 'fire',
                x: Math.random() * (this.width * 0.5) + (this.width * 0.05), // Zona izquierda principal
                y: this.height + Math.random() * 5,
                size: Math.random() * 12 + 6,
                speedY: Math.random() * -2 - 1.5,
                speedX: (Math.random() - 0.5) * 1.2,
                life: 1,
                decay: Math.random() * 0.02 + 0.015,
                hue: Math.random() * 30 + 10 // Entre rojo intenso y naranja/amarillo
            });
        }
    }

    emitShadow() {
        // Sombras oscuras tipo humo azulado saliendo por la derecha
        if (Math.random() < 0.8) {
            this.particles.push({
                type: 'shadow',
                x: this.width - (Math.random() * (this.width * 0.5) + (this.width * 0.05)),
                y: this.height / 2 + (Math.random() - 0.5) * 20, // Humo emana desde el centro vert
                size: Math.random() * 18 + 10,
                speedY: (Math.random() - 0.5) * 1.5 - 0.2,
                speedX: Math.random() * -1.5 - 0.5, // Empuja hacia el centro/izquierda
                life: 1,
                decay: Math.random() * 0.012 + 0.01
            });
        }
    }

    animate() {
        // Limpiamos el track completamente por frame (sin trailing agresivo para no manchar border radius)
        this.ctx.clearRect(0, 0, this.width, this.height);

        const isDark = document.documentElement.classList.contains('dark');

        // Emisión y Combustión
        // Si Rengoku (Light) está actuando: emite fuego para defender su terreno, JinWoo intenta tomarlo
        // Si JinWoo (Dark) está actuando: Sombra domina, Rengoku sobrevive levemente
        if (isDark) {
            // Activo JinWoo -> Sombras fuman fuerte desde la derecha
            this.emitShadow();
            if (Math.random() < 0.3) this.emitShadow(); // Emisión de refuerzo
            if (Math.random() < 0.2) this.emitFire();   // Llamas débiles sobreviviendo
        } else {
            // Activo Rengoku -> Fuego ruge desde la izquierda
            this.emitFire();
            if (Math.random() < 0.3) this.emitFire();   // Llamas furiosas
            if (Math.random() < 0.2) this.emitShadow(); // Sombras escondidas
        }

        // --- RENDERIZADO DE FUEGO ---
        // Composite Screen interactivo que se retro-ilumina sobre sí mismo para brillo anime
        this.ctx.globalCompositeOperation = 'screen';

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];

            if (p.type === 'fire') {
                p.x += p.speedX;
                p.y += p.speedY;
                p.life -= p.decay;

                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }

                this.ctx.beginPath();
                let currentSize = p.size * p.life;
                if (currentSize < 0) currentSize = 0;
                this.ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

                // Color degrades based on life (starts yellow/orange, ends red)
                let currentHue = p.hue + (1 - p.life) * 15;
                let gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                gradient.addColorStop(0, `hsla(${currentHue}, 100%, 70%, ${p.life})`);
                gradient.addColorStop(0.4, `hsla(${currentHue}, 100%, 50%, ${p.life * 0.8})`);
                gradient.addColorStop(1, `hsla(${currentHue}, 100%, 30%, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        }

        // --- RENDERIZADO DE SOMBRAS Y HUMO ---
        // Normal composition blending para que se vea humo denso oscuro sumergiendo a los otros pixeles
        this.ctx.globalCompositeOperation = 'source-over';

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];

            if (p.type === 'shadow') {
                p.x += p.speedX;
                p.y += p.speedY;
                p.life -= p.decay;

                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }

                this.ctx.beginPath();
                let currentSize = p.size * p.life;
                if (currentSize < 0) currentSize = 0;
                this.ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

                let gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                // Glow azul espectral tenue + núcleo profundamente negro/azul
                gradient.addColorStop(0, `rgba(5, 8, 15, ${p.life * 0.9})`);
                gradient.addColorStop(0.5, `rgba(15, 25, 45, ${p.life * 0.7})`);
                gradient.addColorStop(1, `rgba(40, 80, 200, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        }

        requestAnimationFrame(this.animate);
    }
}

// Escuchar cuado el documento cargue para inicializar los iconos y el motor Canvas en su estado correcto
document.addEventListener('DOMContentLoaded', () => {
    actualizarIconosTema();

    // Inyectar el Particle Engine a todos los Canvas detectados
    document.querySelectorAll('.themeAnimeCanvas').forEach(canvas => {
        new ThemeParticleEngine(canvas);
    });
});
