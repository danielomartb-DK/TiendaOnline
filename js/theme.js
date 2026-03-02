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
        const rect = this.canvas.getBoundingClientRect(); // Tomar la escala física expandida (-inset)
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    emitFire() {
        // Fuego orgánico contenido. pX margen lateral virtual interno del canvas
        const pX = this.width * 0.15;
        const innerW = this.width - (pX * 2);

        if (Math.random() < 0.95) {
            this.particles.push({
                type: 'fire',
                x: pX + (Math.random() * innerW * 0.5), // Lado izquierdo de la píldora virtual
                y: this.height * 0.75 + Math.random() * 5, // Nace dentro de la parte inferior de la píldora
                size: Math.random() * 10 + 6, // Pequeñas para que no crucen el borde
                speedY: Math.random() * -1.5 - 0.5,
                speedX: (Math.random() - 0.5) * 1.5,
                life: 1,
                decay: Math.random() * 0.04 + 0.02, // Muerte rápida difuminada (evita bordes duros)
                hue: Math.random() * 25 + 5
            });
        }
    }

    emitShadow() {
        // Sombras oscuras tipo Monarch.
        const pX = this.width * 0.15;
        const innerW = this.width - (pX * 2);

        if (Math.random() < 0.95) {
            this.particles.push({
                type: 'shadow',
                x: this.width - pX - (Math.random() * innerW * 0.5), // Lado derecho interno
                y: this.height * 0.5 + (Math.random() - 0.5) * 15, // Centro vertical disperso
                size: Math.random() * 15 + 8, // Nubes medianas
                speedY: (Math.random() - 0.5) * 1,
                speedX: Math.random() * -1.0 - 0.2, // Tira hacia la izquierda
                life: 1,
                decay: Math.random() * 0.03 + 0.02 // Muerte rápida
            });
        }
    }

    animate() {
        // Limpiamos el track completamente por frame (sin trailing agresivo para no manchar border radius)
        this.ctx.clearRect(0, 0, this.width, this.height);

        const isDark = document.documentElement.classList.contains('dark');

        // Emisión Invertida a petición del usuario
        if (isDark) {
            // Cuando activo JinWoo (Noche), el track a la izquierda se inunda de FUEGO
            this.emitFire();
            if (Math.random() < 0.6) this.emitFire(); // Doble inyección (llena y sobresale)
        } else {
            // Cuando activo Rengoku (Día), el track a la derecha emana SOMBRAS (Negro/Morado)
            this.emitShadow();
            if (Math.random() < 0.6) this.emitShadow(); // Doble inyección densa
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

                let currentHue = p.hue + (1 - p.life) * 35; // Viaja de rojo a amarillo puro
                let gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                gradient.addColorStop(0, `hsla(${currentHue + 20}, 100%, 75%, ${p.life})`); // Núcleo candente brillante
                gradient.addColorStop(0.3, `hsla(${currentHue}, 100%, 55%, ${p.life * 0.9})`); // Naranja intermedio
                gradient.addColorStop(1, `hsla(${currentHue - 10}, 100%, 40%, 0)`); // Glow disipado exterior

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        }

        // --- RENDERIZADO DE SOMBRAS Y HUMO ---
        // Normal composition blending para oscurecer y fumar el background
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
                // Oscuridad Jin-Woo: Negro Profundo y Morado Oscuro/Frío
                gradient.addColorStop(0, `rgba(5, 0, 15, ${p.life * 0.95})`); // Núcleo casi negro
                gradient.addColorStop(0.4, `rgba(30, 5, 65, ${p.life * 0.8})`); // Aura morada densa
                gradient.addColorStop(1, `rgba(80, 20, 160, 0)`); // Difuminado morado brillante externo

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
