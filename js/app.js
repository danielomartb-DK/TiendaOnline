/**
 * JS/App.js - LÃ³gica Principal (index.html)
 * Renderiza productos desde Supabase y maneja el carrito.
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// FunciÃ³n auxiliar para obtener la key del carrito basada en el usuario actual
function getCartKey() {
    if (window.novaAuth && window.novaAuth.user && window.novaAuth.user.user) {
        return `PixelWear_cart_${window.novaAuth.user.user.id}`;
    }
    return 'PixelWear_cart_anon';
}

// Estado local de la aplicaciÃ³n
const state = {
    productos: [],
    carrito: [],
    productosAMostrar: 8 // Cantidad inicial de productos
};

// Referencias del DOM
const refs = {
    grid: document.getElementById('productGrid'),
    loader: document.getElementById('loader'),
    errorMsg: document.getElementById('errorMessage'),
    btnRetry: document.getElementById('retryBtn'),
    cartCounter: document.getElementById('cartCounter'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMessage')
};

/**
 * Inicializa la aplicaciÃ³n
 */
async function initApp() {
    // Cargar el carrito segÃºn el usuario
    state.carrito = JSON.parse(localStorage.getItem(getCartKey())) || [];

    actualizarContadorCarrito();

    try {
        mostrarLoader(true);
        console.log('Cargando productos desde Supabase...');
        const isAdmin = window.novaAuth && window.novaAuth.isAdmin && window.novaAuth.isAdmin();
        const todosProductos = await obtenerProductos(!isAdmin);
        // Filtrar productos eliminados suavemente (marcados con [ELIMINADO]) para que NUNCA se muestren
        state.productos = todosProductos.filter(p => !p.nombre || !p.nombre.startsWith('[ELIMINADO]'));

        console.log('Productos recibidos:', state.productos.length);
        renderizarProductos(state.productos);
    } catch (error) {
        console.warn('Error en API, usando datos de prueba:', error.message);
        usarDatosDePrueba();
    } finally {
        mostrarLoader(false);
    }

    if (refs.btnRetry) {
        refs.btnRetry.addEventListener('click', initApp);
    }

    // Inicializar buscador en vivo
    initBuscador();
}

/**
 * Inicializa la lógica del buscador de la navbar principal en tiempo real
 */
function initBuscador() {
    const searchInput = document.getElementById('searchInput');
    const searchInputMobile = document.getElementById('searchInputMobile');

    const handleSearch = (e) => {
        const query = e.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        if (!query) {
            renderizarProductos(state.productos);
            return;
        }
        const productosFiltrados = state.productos.filter(p => {
            const nombre = p.nombre ? p.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
            const desc = p.descripcion ? p.descripcion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
            return nombre.includes(query) || desc.includes(query);
        });
        renderizarProductos(productosFiltrados);
    };

    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (searchInputMobile) searchInputMobile.addEventListener('input', handleSearch);
}

/**
 * Renderiza el HTML dinÃ¡mico de cada producto en el DOM
 */
function renderizarProductos(productos) {
    if (!productos || productos.length === 0) {
        refs.grid.innerHTML = '<p class="text-center text-slate-500 py-10" style="grid-column: 1/-1;">No se encontraron productos.</p>';
        if (document.getElementById('verMasContainer')) document.getElementById('verMasContainer').classList.add('hidden');
        return;
    }

    const isAdmin = window.novaAuth && window.novaAuth.isAdmin && window.novaAuth.isAdmin();

    // Lógica de Paginación: Solo mostrar una parte
    const paginados = productos.slice(0, state.productosAMostrar);
    const hayMas = productos.length > state.productosAMostrar;

    refs.grid.innerHTML = paginados.map((p, index) => {
        const price = Number(p.precio) || 0;
        const formattedPrice = window.CurrencyManager ? window.CurrencyManager.formatPrice(price) : '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2 });
        const stockQty = Number(p.stock) || 0;
        const isLowStock = stockQty > 0 && stockQty <= 5;
        const outOfStock = stockQty <= 0;
        const disabledClass = outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110';

        // Delay dinámico para efecto de cascada (stagger)
        const delay = ((index % 4) * 0.12).toFixed(2);

        let stockBadge = '';
        if (outOfStock) {
            stockBadge = '<span class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Agotado</span>';
        } else if (isLowStock) {
            stockBadge = '<span class="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Solo ' + stockQty + ' disponibles</span>';
        } else if (price > 100) {
            stockBadge = '<span class="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Envío Gratis</span>';
        }

        const imagenUrl = p.imagen_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=400';

        // Botón Administrador: Ojo de visibilidad
        let adminToggle = '';
        if (isAdmin) {
            adminToggle = `
                <button onclick="toggleVisibilidadDesdeIndex(${p.id_producto}, ${p.estado}, event)" 
                        class="absolute top-3 right-3 z-20 bg-white/90 dark:bg-slate-800/90 p-2 rounded-full shadow-lg text-slate-700 dark:text-slate-200 hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined text-[20px]">${p.estado ? 'visibility' : 'visibility_off'}</span>
                </button>
            `;
        }

        return `<div data-holo class="holo-card reveal-item relative ${!p.estado ? 'grayscale opacity-60' : ''} bg-white dark:bg-[#0c1222] border border-slate-200/80 dark:border-slate-700/60 rounded-2xl overflow-hidden group flex flex-col transition-all duration-300" style="animation-delay: ${delay}s;">
            ${adminToggle}
            <a href="producto.html?id=${p.id_producto}" class="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 block">
                <img alt="${p.nombre}" src="${imagenUrl}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                ${stockBadge}
            </a>
            <div class="p-3 md:p-4 flex flex-col flex-1">
                <a href="producto.html?id=${p.id_producto}" class="text-slate-800 dark:text-slate-100 font-semibold text-xs md:text-sm mb-1 line-clamp-2 hover:text-cyan-500 transition-colors leading-snug">${p.nombre}</a>
                <div class="flex items-center gap-0.5 mb-2">
                    <span class="material-symbols-outlined text-amber-400 text-xs md:text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-amber-400 text-xs md:text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-amber-400 text-xs md:text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-amber-400 text-xs md:text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
                    <span class="material-symbols-outlined text-slate-300 dark:text-slate-600 text-xs md:text-sm">star</span>
                </div>
                <div class="mt-auto">
                    <div class="flex items-baseline gap-2 mb-3">
                        <span class="text-xl md:text-2xl font-mecha font-bold text-slate-900 dark:text-white">${formattedPrice}</span>
                    </div>
                    <button class="w-full bg-gradient-to-r from-amber-400 to-orange-600 dark:from-cyan-600 dark:to-blue-700 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs md:text-sm ${disabledClass}" onclick="agregarAlCarrito(${p.id_producto})" ${outOfStock ? 'disabled' : ''}>
                        <span class="material-symbols-outlined text-base md:text-xl">shopping_cart</span>
                        ${outOfStock ? 'Agregar' : 'Agregar'}
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    // Manejar visibilidad del botón "Ver Más"
    const verMasContainer = document.getElementById('verMasContainer');
    if (verMasContainer) {
        if (hayMas) {
            verMasContainer.classList.remove('hidden');
        } else {
            verMasContainer.classList.add('hidden');
        }
    }

    if (typeof initHoloCards === 'function') initHoloCards();
    initScrollReveal();
}

/**
 * Carga más productos incrementando el límite visual
 */
function cargarMasProductos() {
    state.productosAMostrar += 8;
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (query) {
        const filtrados = state.productos.filter(p =>
            (p.nombre && p.nombre.toLowerCase().includes(query)) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(query))
        );
        renderizarProductos(filtrados);
    } else {
        renderizarProductos(state.productos);
    }
}

/**
 * Revela elementos con animación cuando entran en el viewport (Intersection Observer)
 */
function initScrollReveal() {
    const items = document.querySelectorAll('.reveal-item:not(.revealed)');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Una vez revelado, dejamos de observarlo para ahorrar recursos
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    items.forEach(item => observer.observe(item));
}

/**
 * Función global para alternar visibilidad desde la tienda principal (Index)
 */
window.toggleVisibilidadDesdeIndex = async (id, estado, event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
        await actualizarProducto(id, { estado: !estado });
        mostrarToast(`Producto ${!estado ? 'visible' : 'oculto'} correctamente.`);
        const isAdmin = window.novaAuth && window.novaAuth.isAdmin && window.novaAuth.isAdmin();
        const todosProductos = await obtenerProductos(!isAdmin);
        state.productos = todosProductos.filter(p => !p.nombre || !p.nombre.startsWith('[ELIMINADO]'));
        renderizarProductos(state.productos);
    } catch (err) {
        mostrarToast("Error: " + err.message, "error");
    }
};

/**
 * Agrega un producto al carrito
 */
function agregarAlCarrito(idProducto) {
    const producto = state.productos.find(p => p.id_producto === idProducto);
    if (!producto) return;
    const itemCarrito = state.carrito.find(item => item.id_producto === idProducto);

    if (itemCarrito) {
        if (itemCarrito.cantidad < producto.stock) {
            itemCarrito.cantidad += 1;
        } else {
            mostrarToast('LÃ­mite de stock alcanzado.', 'error');
            return;
        }
    } else {
        state.carrito.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            imagen_url: producto.imagen_url,
            cantidad: 1,
            stock: producto.stock
        });
    }

    localStorage.setItem(getCartKey(), JSON.stringify(state.carrito));
    actualizarContadorCarrito();
    mostrarToast('¡Agregado al Carrito!');
}

function actualizarContadorCarrito() {
    if (!refs.cartCounter) return;
    const totalItems = state.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    refs.cartCounter.textContent = totalItems > 99 ? '+99' : totalItems;
}

function mostrarToast(msg, type = 'success') {
    if (!refs.toast) return;
    if (refs.toastMsg) refs.toastMsg.textContent = msg;
    refs.toast.className = 'toast show ' + type;
    setTimeout(() => { refs.toast.classList.remove('show'); }, 4000);
}

function mostrarLoader(isVisible) {
    if (refs.loader) refs.loader.style.display = isVisible ? 'flex' : 'none';
    if (refs.errorMsg) refs.errorMsg.classList.add('hidden');
}

function usarDatosDePrueba() {
    const mockData = [
        { id_producto: 1, nombre: 'AudÃ­fonos Premium InalÃ¡mbricos', precio: 299.00, stock: 15, imagen_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=400', estado: true },
        { id_producto: 2, nombre: 'Reloj Minimalista de Cuero 42mm', precio: 150.00, stock: 5, imagen_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=400', estado: true }
    ];
    state.productos = mockData;
    renderizarProductos(mockData);
}
