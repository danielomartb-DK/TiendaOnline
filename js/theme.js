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
            icon.innerHTML = `
                <canvas class="avatarAnimeCanvas pointer-events-none z-0" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px;" width="120" height="120"></canvas>
                <img src="assets/images/avatar_jinwoo.png" alt="JinWoo (Dark Mode)" class="relative z-10 w-full h-full rounded-full object-cover border-[3px] border-[#4f46e5] shadow-[0_0_20px_rgba(79,70,229,0.9)] pointer-events-none transition-transform duration-300 group-hover:scale-110" />
            `;
        } else {
            // Modo Claro -> Rengoku
            icon.innerHTML = `
                <canvas class="avatarAnimeCanvas pointer-events-none z-0" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px;" width="120" height="120"></canvas>
                <img src="assets/images/avatar_rengoku.png" alt="Rengoku (Light Mode)" class="relative z-10 w-full h-full rounded-full object-cover border-[3px] border-[#f97316] shadow-[0_0_20px_rgba(249,115,22,0.9)] pointer-events-none transition-transform duration-300 group-hover:scale-110" />
            `;
        }

        // Iniciar el aura del avatar
        const avatarCanvas = icon.querySelector('.avatarAnimeCanvas');
        if (avatarCanvas) {
            // Cancelar el motor de aura si ya existe uno anterior
            if (icon.avatarEngine) icon.avatarEngine.stop();
            icon.avatarEngine = new AvatarParticleEngine(avatarCanvas, isDark ? 'shadow' : 'fire');
        }
    });
}
// --- Motor Avanzado de Partículas para Avatares (Auras) ---
class AvatarParticleEngine {
    constructor(canvas, type) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = type; // 'fire' or 'shadow'
        this.particles = [];
        this.isActive = true;

        this.resize();
        this.resizeHandler = () => this.resize();
        window.addEventListener('resize', this.resizeHandler);

        this.animate = this.animate.bind(this);
        this.animationId = requestAnimationFrame(this.animate);
    }

    stop() {
        this.isActive = false;
        window.removeEventListener('resize', this.resizeHandler);
        cancelAnimationFrame(this.animationId);
    }

    resize() {
        if (!this.canvas.parentElement) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Radio del retrato (el padre tiene un tamaño aproximado de 56px-64px, el canvas es mayor por -inset)
        const parentRect = this.canvas.parentElement.getBoundingClientRect();
        this.avatarRadius = parentRect.width / 2;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    emit() {
        if (this.width === 0) this.resize();
        if (this.width === 0) return;

        if (this.type === 'fire') {
            if (Math.random() < 0.9) {
                const angle = Math.random() * Math.PI * 2;
                const r = this.avatarRadius + (Math.random() * 2 - 1);
                this.particles.push({
                    x: this.centerX + Math.cos(angle) * r,
                    y: this.centerY + Math.sin(angle) * r,
                    size: Math.random() * 8 + 4,
                    speedX: Math.cos(angle) * 0.8 + (Math.random() - 0.5),
                    speedY: Math.sin(angle) * 0.8 - Math.random() * 1.5, // Sube un poco
                    life: 1,
                    decay: Math.random() * 0.03 + 0.02,
                    hue: Math.random() * 25 + 5
                });
            }
        } else {
            if (Math.random() < 0.9) {
                const angle = Math.random() * Math.PI * 2;
                const r = this.avatarRadius + (Math.random() * 2 - 1);
                this.particles.push({
                    x: this.centerX + Math.cos(angle) * r,
                    y: this.centerY + Math.sin(angle) * r,
                    size: Math.random() * 12 + 6,
                    speedX: Math.cos(angle) * 0.5 + (Math.random() - 0.5),
                    speedY: Math.sin(angle) * 0.5 + (Math.random() - 0.5),
                    life: 1,
                    decay: Math.random() * 0.02 + 0.015
                });
            }
        }
    }

    animate() {
        if (!this.isActive) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.emit();
        if (Math.random() < 0.5) this.emit();

        if (this.type === 'fire') {
            this.ctx.globalCompositeOperation = 'screen';
            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
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

                let currentHue = p.hue + (1 - p.life) * 35;
                let gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                gradient.addColorStop(0, `hsla(${currentHue + 15}, 100%, 65%, ${p.life})`);
                gradient.addColorStop(1, `hsla(${currentHue}, 100%, 30%, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i];
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
                gradient.addColorStop(0, `rgba(10, 5, 25, ${p.life * 0.9})`);
                gradient.addColorStop(0.5, `rgba(45, 15, 80, ${p.life * 0.6})`);
                gradient.addColorStop(1, `rgba(80, 20, 150, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        }

        this.animationId = requestAnimationFrame(this.animate);
    }
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
        // Fuego intenso, dinámico y orgánico contenido (Rengoku)
        if (Math.random() < 0.95) {
            this.particles.push({
                type: 'fire',
                x: Math.random() * (this.width * 0.5) + (this.width * 0.05), // Zona izquierda principal
                y: this.height * 0.8 + Math.random() * 5, // Nace cerca de la base interior
                size: Math.random() * 12 + 6, // Tamaño orgánico
                speedY: Math.random() * -2 - 1.5, // Sube rápido
                speedX: (Math.random() - 0.5) * 1.2, // Esparcimiento lateral
                life: 1,
                decay: Math.random() * 0.02 + 0.015,
                hue: Math.random() * 30 + 10 // Entre rojo intenso y naranja/amarillo
            });
        }
    }

    emitShadow() {
        // Sombras oscuras negro y morado saliendo por la derecha (JinWoo)
        if (Math.random() < 0.95) {
            this.particles.push({
                type: 'shadow',
                x: this.width - (Math.random() * (this.width * 0.5) + (this.width * 0.05)), // Zona derecha
                y: this.height / 2 + (Math.random() - 0.5) * 20, // Humo emana desde el centro vert
                size: Math.random() * 18 + 10, // Nubes oscuras densas
                speedY: (Math.random() - 0.5) * 1.5 - 0.2, // Sube levemente
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

window.AvatarParticleEngine = AvatarParticleEngine;
