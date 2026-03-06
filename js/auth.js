/**
 * JS/Auth.js - AutenticaciÃ³n con Supabase
 * Maneja el registro, inicio de sesiÃ³n y persistencia del usuario.
 */

class AuthManager {
    constructor() {
        this.supabaseUrl = SUPABASE_URL; // Viene de api.js
        this.supabaseKey = SUPABASE_KEY; // Viene de api.js
        this.sessionKey = 'PixelWear_session';
        this.user = this.getSession();
        this.profileData = null; // Para guardar datos de la tabla 'cliente'
        this._refreshing = false;

        // Auto-refresh si el token está expirado
        this._tryAutoRefresh();

        this.initUI();
    }

    /**
     * Busca los datos extendidos del perfil en la base de datos (tabla cliente)
     */
    async fetchProfile() {
        if (!this.user || !this.user.user) return;
        try {
            // obtenerClientePorEmail está definido en api.js
            if (typeof obtenerClientePorEmail === 'function') {
                const data = await obtenerClientePorEmail(this.user.user.email);
                if (data) {
                    this.profileData = data;
                    this.updateUI(); // Re-renderizar con el nombre real
                }
            }
        } catch (e) {
            console.warn("No se pudo cargar el perfil extendido:", e);
        }
    }

    /**
     * Obtiene la sesiÃ³n actual desde localStorage
     */
    getSession() {
        const session = localStorage.getItem(this.sessionKey);
        return session ? JSON.parse(session) : null;
    }

    /**
     * Verifica si el usuario actual es administrador
     */
    isAdmin() {
        if (!this.user || !this.user.user) return false;
        const adminMails = ['danieltijaro28@gmail.com', 'prueba123@gmail.com'];
        return adminMails.includes(this.user.user.email);
    }

    /**
     * Guarda la nueva sesiÃ³n y actualiza el estado interno
     */
    setSession(sessionData) {
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        this.user = sessionData;
        this.updateUI();
        this.fetchProfile(); // Traer nombre real desde la DB
    }

    /**
     * Intenta refrescar el token automáticamente si está expirado
     */
    async _tryAutoRefresh() {
        if (!this.user) return;
        // Verificar si el token JWT ha expirado
        const session = this.user.session || this.user;
        const accessToken = session.access_token;
        const refreshToken = session.refresh_token;
        if (!accessToken || !refreshToken) return;

        try {
            // Decodificar JWT para ver si expiró (payload es la 2da parte base64)
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            const expiresAt = payload.exp * 1000; // a ms
            const now = Date.now();
            // Si expira en menos de 60 segundos, refrescar
            if (now > expiresAt - 60000) {
                console.log('Token expirado o por expirar, refrescando...');
                await this.refreshSession(refreshToken);
            }
        } catch (e) {
            console.warn('No se pudo verificar expiración del token:', e);
        }
    }

    /**
     * Refresca la sesión usando el refresh_token de Supabase
     */
    async refreshSession(refreshToken) {
        if (this._refreshing) return;
        this._refreshing = true;
        try {
            const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (!response.ok) {
                console.error('Refresh token falló, cerrando sesión');
                this.logout();
                return;
            }

            const data = await response.json();
            this.setSession(data);
            console.log('Sesión refrescada exitosamente');
        } catch (err) {
            console.error('Error refrescando sesión:', err);
        } finally {
            this._refreshing = false;
        }
    }

    /**
     * Cierra la sesión
     */
    logout() {
        localStorage.removeItem(this.sessionKey);
        this.user = null;
        // Redirigir al inicio inmediatamente en lugar de recargar en el mismo sitio
        window.location.href = 'index.html';
    }

    /**
     * Iniciar SesiÃ³n (Email & Password)
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error_code === 'email_not_confirmed' || data.msg === 'Email not confirmed') {
                    throw new Error('Revisa tu bandeja de entrada: hemos enviado un correo para confirmar tu cuenta antes de iniciar sesiÃ³n.');
                }
                const errorMsg = data.message || data.error_description || data.msg || 'Error al iniciar sesiÃ³n';
                // Traducir mensajes comunes de Supabase al espaÃ±ol para mejor UX
                if (errorMsg === 'Invalid login credentials') {
                    throw new Error('Correo o contraseÃ±a incorrectos.');
                }
                throw new Error(errorMsg);
            }

            this.setSession(data);
            return data;
        } catch (error) {
            console.error('Login Error:', error);
            throw error;
        }
    }

    /**
     * Registro de nuevo usuario
     */
    async register(email, password, displayName = '') {
        try {
            const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'apikey': this.supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    data: { name: displayName }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.message || data.error_description || data.msg || 'Error al registrar la cuenta';
                throw new Error(errorMsg);
            }

            // Si Supabase devuelve un objeto user en data (y no data.session), es porque requiere confirmación.
            if (!data.session && data.user) {
                throw new Error('¡Registro exitoso! Por favor ve a tu correo electrónico y haz clic en el enlace para confirmar tu cuenta y poder iniciar sesión.');
            }

            if (data.session) {
                this.setSession(data.session);
            }
            return data;
        } catch (error) {
            console.error('Register Error:', error);
            throw error;
        }
    }

    /**
     * Inicializa eventos y elementos UI que dependen del Auth
     */
    initUI() {
        // Mejor soporte para móviles y clicks dentro de elementos
        document.addEventListener('click', (e) => {
            // Manejar Logout
            const logoutBtn = e.target.closest('#btnLogout');
            if (logoutBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.logout();
                return;
            }

            // Manejar Toggle de Mi Cuenta
            const accountToggle = e.target.closest('#accountToggle');
            const accountDropdown = document.getElementById('accountDropdown');

            // Solo interceptar si el click es en el disparador (fuera del dropdown interno)
            if (accountToggle && (!accountDropdown || !accountDropdown.contains(e.target))) {
                e.preventDefault();
                e.stopPropagation();
                if (accountDropdown) {
                    accountDropdown.classList.toggle('opacity-0');
                    accountDropdown.classList.toggle('invisible');
                    accountDropdown.classList.toggle('pointer-events-none');
                    accountDropdown.classList.toggle('translate-y-2'); // Efecto sutil al abrir
                }
            } else if (accountDropdown && !accountDropdown.contains(e.target)) {
                // Cerrar si se hace click fuera de todo el componente
                accountDropdown.classList.add('opacity-0', 'invisible', 'pointer-events-none');
                accountDropdown.classList.remove('translate-y-2');
            }
        });

        // Actualizar visualmente la barra al cargar
        this.updateUI();
        this.fetchProfile(); // Intentar cargar nombre real
    }

    /**
     * Cambia la barra de navegaciÃ³n basado en el estado
     */
    updateUI() {
        const authContainers = document.querySelectorAll('.auth-container-ui');

        authContainers.forEach(container => {
            if (this.user && this.user.user) {
                // Usuario Logeado
                let userName = 'Usuario';
                let fullName = '';

                // Prioridad 1: Datos de la tabla 'cliente' (DB)
                if (this.profileData && this.profileData.nombres) {
                    fullName = this.profileData.nombres;
                    if (this.profileData.apellidos) fullName += ' ' + this.profileData.apellidos;
                }
                // Prioridad 2: Metadatos de Autenticación (Supabase Auth)
                else if (this.user.user.user_metadata) {
                    const meta = this.user.user.user_metadata;
                    fullName = meta.name || meta.full_name || meta.display_name || '';
                }

                // Fallback: Prefijo del email
                if (!fullName && this.user.user.email) {
                    fullName = this.user.user.email.split('@')[0];
                }

                if (fullName) {
                    userName = fullName.trim().split(' ')[0]; // Solo primer nombre para el saludo
                }

                const displayName = fullName || this.user.user.email;
                const shortName = userName;

                container.innerHTML = `
                    <div id="accountToggle" class="relative cursor-pointer flex flex-col items-start leading-tight select-none">
                        <span class="text-xs text-slate-300 pointer-events-none">Hola, ${shortName}</span>
                        <div class="flex items-center gap-1 pointer-events-none">
                            <span class="text-sm font-bold">Mi Cuenta</span>
                            <span class="material-symbols-outlined text-[1rem]">arrow_drop_down</span>
                        </div>
                        
                        <!-- Dropdown menu (Controlado por JS) -->
                        <div id="accountDropdown" class="absolute top-12 right-0 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl opacity-0 invisible pointer-events-none transition-all duration-300 z-[100] overflow-hidden text-slate-900 dark:text-white">
                            <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mb-1">Tu Cuenta</p>
                                <p class="font-bold text-sm truncate">${displayName}</p>
                                <p class="text-[10px] text-slate-500 truncate">${this.user.user.email}</p>
                            </div>
                            <ul class="py-2 text-sm">
                                <li>
                                    <a href="perfil.html" class="group flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 flex items-center justify-center">
                                            <span class="material-symbols-outlined text-[20px]">account_circle</span>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="font-bold">Mi Perfil</span>
                                            <span class="text-[10px] text-slate-400">Edita tus datos</span>
                                        </div>
                                    </a>
                                </li>
                                <li>
                                    <a href="mis-pedidos.html" class="group flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <div class="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 flex items-center justify-center">
                                            <span class="material-symbols-outlined text-[20px]">package</span>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="font-bold">Tus Pedidos</span>
                                            <span class="text-[10px] text-slate-400">Ver historial</span>
                                        </div>
                                    </a>
                                </li>
                                ${this.isAdmin() ? `
                                <li>
                                    <a href="admin.html" class="group flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-t border-slate-50 dark:border-slate-800">
                                        <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center">
                                            <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="font-bold text-primary">Panel Admin</span>
                                            <span class="text-[10px] text-slate-400">Gestión total</span>
                                        </div>
                                    </a>
                                </li>` : ''}
                                <li class="px-2 pt-2">
                                    <button id="btnLogout" type="button" class="w-full flex items-center justify-center gap-2 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-bold transition-all cursor-pointer">
                                        <span class="material-symbols-outlined text-[20px]">logout</span>
                                        Cerrar Sesión
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                `;
            } else {
                // No Logeado
                container.innerHTML = `
                    <a href="index.html" class="flex flex-col items-start leading-tight cursor-pointer hover:underline cursor-not-allowed">
                        <span class="text-xs text-slate-300">Hola, ${userName}</span>
                        <span class="text-sm font-bold">Mi Cuenta</span>
                    </a>
                `;
            }
        });
    }
}

// Instanciar Auth Manager globalmente
window.novaAuth = new AuthManager();

