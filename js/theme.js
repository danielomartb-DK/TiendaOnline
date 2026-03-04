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

window.toggleTheme = function () {
    // Declaración vaciada aquí para evitar duplicación. La función real está al fondo de este archivo
    // ligada permanentemente al scope global y al triggerBurst.
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
                <canvas class="avatarAnimeCanvas pointer-events-none z-[-1]" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px;" width="120" height="120"></canvas>
                <img src="assets/images/avatar_jinwoo.png" alt="JinWoo (Dark Mode)" class="relative z-10 w-full h-full rounded-full object-cover border-[3px] border-[#4f46e5] shadow-[0_0_20px_rgba(79,70,229,0.9)] pointer-events-none transition-transform duration-300 group-hover:scale-110" />
            `;
        } else {
            // Modo Claro -> Rengoku
            icon.innerHTML = `
                <canvas class="avatarAnimeCanvas pointer-events-none z-[-1]" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 120px; height: 120px;" width="120" height="120"></canvas>
                <img src="assets/images/avatar_rengoku.png" alt="Rengoku (Light Mode)" class="relative z-10 w-full h-full rounded-full object-cover border-[3px] border-[#f97316] shadow-[0_0_20px_rgba(249,115,22,0.9)] pointer-events-none transition-transform duration-300 group-hover:scale-110" />
            `;
        }

        // Iniciar el aura del avatar
        const avatarCanvas = icon.querySelector('.avatarAnimeCanvas');
        if (avatarCanvas) {
            // Cancelar el motor de aura si ya existe uno anterior
            if (icon.avatarEngine) icon.avatarEngine.stop();
            // Reducimos radicalmente la cantidad de humo (0.35) de Noche para despejar la vista del Slider
            icon.avatarEngine = new AvatarParticleEngine(avatarCanvas, isDark ? 'shadow' : 'fire', isDark ? 0.35 : 1);
        }
    });
}
// --- Motor Avanzado de Partículas para Avatares (Auras) ---
class AvatarParticleEngine {
    constructor(canvas, type = 'fire', densityMultiplier = 1) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = type; // 'fire' (Rengoku) o 'shadow' (Jin-Woo)
        this.densityMultiplier = densityMultiplier;
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
                    size: Math.random() * 10 + 5, // Fuego interno normal Restaurado
                    speedX: Math.cos(angle) * 0.8 + (Math.random() - 0.5),
                    speedY: Math.sin(angle) * 0.8 - Math.random() * 1.5,
                    life: 1,
                    decay: Math.random() * 0.02 + 0.015, // Desvanecimiento más lento
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
                    size: Math.random() * 6 + 4, // Partículas de Materia Oscura muy pequeñas y sutiles
                    speedX: Math.cos(angle) * 0.5 + (Math.random() - 0.5),
                    speedY: Math.sin(angle) * 0.5 + (Math.random() - 0.5) - 0.5,
                    life: 1,
                    decay: Math.random() * 0.02 + 0.015 // Rapidez de desvanecimiento para despejar visibilidad
                });
            }
        }
    }

    animate() {
        if (!this.isActive) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Emitir base según el multiplicador dinámico
        for (let i = 0; i < Math.floor(3 * this.densityMultiplier); i++) {
            this.emit();
        }
        // Intercalar las fracciones del multiplicador
        if (Math.random() < ((3 * this.densityMultiplier) % 1)) {
            this.emit();
        }

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

                // Efecto orgánico estirando sutilmente la geometría en el eje vertical simulando fuego
                this.ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

                let currentHue = p.hue + (1 - p.life) * 35;
                let gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                // Escalas de opacidad suaves para eliminar bordes duros de la esfera
                gradient.addColorStop(0, `hsla(${currentHue + 15}, 100%, 65%, ${p.life * 0.6})`);
                gradient.addColorStop(0.4, `hsla(${currentHue}, 100%, 50%, ${p.life * 0.3})`);
                gradient.addColorStop(1, `hsla(${currentHue - 10}, 100%, 30%, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        } else {
            // Humo/Luz del Avatar Modo Oscuro (Jin-Woo Original Materia Oscura)
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
                // Bruma oscura suave de Jin Woo
                gradient.addColorStop(0, `rgba(15, 10, 35, ${p.life * 0.5})`);
                gradient.addColorStop(0.5, `rgba(45, 15, 80, ${p.life * 0.3})`);
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

    triggerBurst(isDark) {
        // Explosión Bimodal Masiva: Si vamos a la Oscuridad (JinWoo) explotamos destellos Azul Cian/Neón que llenan TODO el track.
        // Si vamos a la Luz (Rengoku) explotamos rescoldos Naranja/Blanco.
        const burstCount = 120; // Llenado masivo

        for (let i = 0; i < burstCount; i++) {
            // Repartido en toda la pista
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            // Velocidades drásticas hacia todos lados
            const speedX = (Math.random() - 0.5) * 4;
            const speedY = (Math.random() - 0.5) * 2;
            const size = Math.random() * 8 + 4; // Pedazos grandes y pequeños

            if (isDark) { // -> JinWoo (Oscuridad)
                this.particles.push({
                    type: 'burst_shadow', // Nuevo tipo reactivo de luz azul
                    x: x, y: y, size: size, speedX: speedX, speedY: speedY,
                    life: 1,
                    decay: Math.random() * 0.015 + 0.005 // Tardan mucho en morir (fade out majestuoso)
                });
            } else { // -> Rengoku (Fuego Lleno)
                this.particles.push({
                    type: 'burst_fire', // Tipo de estela puramente ígnea brillante
                    x: x, y: y, size: size, speedX: speedX, speedY: speedY,
                    life: 1,
                    decay: Math.random() * 0.015 + 0.005,
                    hue: Math.random() * 20 + 20 // De naranja puro a amarillo candente
                });
            }
        }
    }

    emitFire(inner = false) {
        if (Math.random() < (inner ? 0.3 : 0.6)) {
            let x, y, speedX, speedY;
            if (inner) {
                // Interior simulando Brasas Lentas o Cenizas que flotan elegantemente
                const r = this.height / 2;
                x = (this.width - r); // Origen cerca de JinWoo (Derecha)
                y = r + (Math.random() - 0.5) * this.height * 0.4; // Dispersión vertical muy leve para dar sensación de concentración
                speedX = -Math.random() * 0.4 - 0.1; // Flotar suave a la izquierda (vs anterior -2.5)
                speedY = (Math.random() - 0.5) * 0.2; // Levitar tranquilamente

            } else {
                // Delineado / Borde Exterior Fuego
                const p = Math.random();
                if (p < 0.45) { // Borde Arriba/Abajo
                    x = Math.random() * this.width;
                    y = Math.random() > 0.5 ? Math.random() * 4 : this.height - Math.random() * 4;
                } else { // Extremos Curvos
                    const angle = Math.random() * Math.PI;
                    const r = this.height / 2;
                    const isRight = Math.random() > 0.5;
                    x = isRight ? (this.width - r) + Math.sin(angle) * r : r - Math.sin(angle) * r;
                    y = r + Math.cos(angle) * r;
                }
                speedX = (Math.random() - 0.5) * 0.3;
                speedY = (Math.random() - 0.5) * 0.3;
            }

            this.particles.push({
                type: 'fire',
                x: x,
                y: y,
                size: inner ? Math.random() * 6 + 3 : Math.random() * 3 + 1.5, // Esferas irregulares pequeñas pero brillantes
                speedY: speedY,
                speedX: speedX,
                life: 1,
                decay: inner ? Math.random() * 0.008 + 0.004 : Math.random() * 0.03 + 0.02, // Extremadamente lentas en morir para que el glow perdure (Magic Floating)
                hue: Math.random() * 30 + 10
            });
        }
    }

    emitShadow(inner = false) {
        if (Math.random() < (inner ? 0.4 : 0.6)) {
            let x, y, speedX, speedY;
            if (inner) {
                // Interior simulando Sombras Lentas/Materia Oscura que flota elegantemente
                const r = this.height / 2;
                x = r; // Origen cerca de Rengoku (Izquierda)
                y = r + (Math.random() - 0.5) * this.height * 0.4; // Concentradas al centro
                speedX = Math.random() * 0.4 + 0.1; // Flotar suave a la derecha (vs anterior +2.5)
                speedY = (Math.random() - 0.5) * 0.2; // Levitar tranquilamente
            } else {
                // Delineado / Borde Exterior Oscuro
                const p = Math.random();
                if (p < 0.45) { // Borde Arriba/Abajo
                    x = Math.random() * this.width;
                    y = Math.random() > 0.5 ? Math.random() * 4 : this.height - Math.random() * 4;
                } else { // Extremos Curvos
                    const angle = Math.random() * Math.PI;
                    const r = this.height / 2;
                    const isRight = Math.random() > 0.5;
                    x = isRight ? (this.width - r) + Math.sin(angle) * r : r - Math.sin(angle) * r;
                    y = r + Math.cos(angle) * r;
                }
                speedX = (Math.random() - 0.5) * 0.3;
                speedY = (Math.random() - 0.5) * 0.3;
            }

            this.particles.push({
                type: 'shadow',
                x: x,
                y: y,
                size: inner ? Math.random() * 6 + 3 : Math.random() * 3 + 1.5,
                speedY: speedY,
                speedX: speedX,
                life: 1,
                decay: inner ? Math.random() * 0.008 + 0.004 : Math.random() * 0.03 + 0.02 // Extremadamente lentas
            });
        }
    }

    animate() {
        // Limpiamos el track completamente por frame (sin trailing agresivo para no manchar border radius)
        this.ctx.clearRect(0, 0, this.width, this.height);

        const isDark = document.documentElement.classList.contains('dark');

        // Emisión Bimodal: El exterior dibuja su tema original, el interior dibuja el contrario masivamente
        if (isDark) {
            // Noche (JinWoo Switch): Borde de Sombra tenue, Núcleo de FUEGO
            this.emitShadow(false); // Borde

            // Interior relleno masivamente de Fuego (Rebajando de x15 Extremos a x6 Equilibrado)
            for (let i = 0; i < 6; i++) {
                this.emitFire(true);
            }
        } else {
            // Día (Rengoku Switch): Borde de Fuego tenue, Núcleo de SOMBRAS
            this.emitFire(false); // Borde

            // Interior relleno masivamente de Sombras (Rebajando de x15 Extremos a x6 Equilibrado)
            for (let i = 0; i < 6; i++) {
                this.emitShadow(true);
            }
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

                let currentHue = p.hue + (1 - p.life) * 35; // Viaja de naranja a amarillo
                let gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                gradient.addColorStop(0, `hsla(${currentHue}, 100%, 75%, ${p.life})`); // Núcleo candente
                gradient.addColorStop(0.4, `hsla(${currentHue - 15}, 100%, 55%, ${p.life * 0.9})`); // Naranja intermedio
                gradient.addColorStop(1, `hsla(${currentHue - 25}, 100%, 50%, 0)`); // Borde desapareciendo sin rojo manchado

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        }

        // --- RENDERIZADO DE JIN-WOO (NEBULA MORADA ORIGINAL) ---
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
                // Aumentamos agresivamente el tamaño para que parezca una gran nube gaseosa en lugar de una canica dura
                let currentSize = p.size * p.life * 2.5;
                if (currentSize < 0) currentSize = 0;
                this.ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

                let gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                // Niebla oscura ultra-difusa y translúcida (Contraste humo filtrado en Modo Claro)
                gradient.addColorStop(0, `rgba(10, 5, 25, ${p.life * 0.7})`); // Núcleo oscurecido y suave
                gradient.addColorStop(0.4, `rgba(30, 20, 60, ${p.life * 0.4})`); // Expansivo morado muy disipado
                gradient.addColorStop(1, `rgba(40, 20, 80, 0)`); // Borde infinito invisible

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }

            // --- BURSTS REACTIVOS --- 
            if (p.type === 'burst_shadow') {
                p.x += p.speedX; p.y += p.speedY; p.life -= p.decay;
                if (p.life <= 0) { this.particles.splice(i, 1); continue; }
                this.ctx.beginPath();
                let currentSize = p.size * p.life; if (currentSize < 0) currentSize = 0;
                this.ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

                // Estallido Cyan Neón del Modo Jinwoo Original
                this.ctx.globalCompositeOperation = 'screen';
                let gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                gradient.addColorStop(0, `rgba(96, 165, 250, ${p.life})`); // Núcleo claro
                gradient.addColorStop(0.5, `rgba(37, 99, 235, ${p.life * 0.8})`); // Aura azul 
                gradient.addColorStop(1, `rgba(30, 58, 138, 0)`); // Borde difuminado

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }

            if (p.type === 'burst_fire') {
                p.x += p.speedX; p.y += p.speedY; p.life -= p.decay;
                if (p.life <= 0) { this.particles.splice(i, 1); continue; }
                this.ctx.beginPath();
                let currentSize = p.size * p.life; if (currentSize < 0) currentSize = 0;
                this.ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

                this.ctx.globalCompositeOperation = 'screen';
                let gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
                gradient.addColorStop(0, `hsla(${p.hue + 10}, 100%, 75%, ${p.life})`); // Brillo naranja-amarillo fuerte
                gradient.addColorStop(0.5, `hsla(${p.hue}, 100%, 50%, ${p.life * 0.8})`);
                gradient.addColorStop(1, `hsla(${p.hue - 15}, 100%, 35%, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        }

        requestAnimationFrame(this.animate);
    }
}

// Variables Globales 
window.appThemeEngines = []; // Referencias limpias 

// Escuchar cuado el documento cargue para inicializar los iconos y el motor Canvas en su estado correcto
document.addEventListener('DOMContentLoaded', () => {
    actualizarIconosTema();

    // Inyectar el Particle Engine a todos los Canvas detectados
    document.querySelectorAll('.themeAnimeCanvas').forEach(canvas => {
        const eng = new ThemeParticleEngine(canvas);
        window.appThemeEngines.push(eng); // Guardar para lanzar bursts desde botón global
    });
});

// Función global para que el botón la llame (reescrita para incluir el Burst Visual)
window.toggleTheme = function () {
    const isDark = document.documentElement.classList.contains('dark');
    const newStateDark = !isDark;

    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('PixelWear_theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('PixelWear_theme', 'dark');
    }

    // Invocar el estallido masivo de estelas de luz en todos los NavBar sliders registrados
    window.appThemeEngines.forEach(eng => eng.triggerBurst(newStateDark));

    // Actualizar iconos gráficos 
    actualizarIconosTema();
};

window.AvatarParticleEngine = AvatarParticleEngine;
