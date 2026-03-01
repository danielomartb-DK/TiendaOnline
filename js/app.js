/**
 * JS/App.js - Lógica Principal (index.html)
 * Renderiza productos desde Supabase y maneja el carrito.
 */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Función auxiliar para obtener la key del carrito basada en el usuario actual
function getCartKey() {
    if (window.novaAuth && window.novaAuth.user && window.novaAuth.user.user) {
        return `novastore_cart_${window.novaAuth.user.user.id}`;
    }
    return 'novastore_cart_anon';
}

// Estado local de la aplicación
const state = {
    productos: [],
    carrito: []
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
 * Inicializa la aplicación
 */
async function initApp() {
    // Cargar el carrito según el usuario
    state.carrito = JSON.parse(localStorage.getItem(getCartKey())) || [];

    actualizarContadorCarrito();

    try {
        mostrarLoader(true);
        console.log('Cargando productos desde Supabase...');
        state.productos = await obtenerProductos();
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
}

/**
 * Renderiza el HTML dinámico de cada producto en el DOM
 */
function renderizarProductos(productos) {
    if (!productos || productos.length === 0) {
        refs.grid.innerHTML = '<p class="text-center text-slate-500 py-10" style="grid-column: 1/-1;">No se encontraron productos.</p>';
        return;
    }

    console.log('Pintando', productos.length, 'tarjetas de producto...');

    refs.grid.innerHTML = productos.map(p => {
        const price = Number(p.precio) || 0;
        const formattedPrice = price.toLocaleString('en-US', { minimumFractionDigits: 2 });
        const stockQty = Number(p.stock) || 0;
        const isLowStock = stockQty > 0 && stockQty <= 5;
        const outOfStock = stockQty <= 0;
        const disabledClass = outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110';

        let stockBadge = '';
        if (outOfStock) {
            stockBadge = '<span class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Agotado</span>';
        } else if (isLowStock) {
            stockBadge = '<span class="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Solo ' + stockQty + ' disponibles</span>';
        } else if (price > 100) {
            stockBadge = '<span class="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Envío Gratis</span>';
        }

        // Imagen: usa la de la BD, o un fallback de Unsplash
        const fallbackImages = [
            'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1526406915894-7bcd65f60845?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400',
            'https://images.unsplash.com/photo-1510519138101-570d1dcb3d8e?auto=format&fit=crop&q=80&w=400'
        ];
        const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
        const imagenUrl = p.imagen_url || randomFallback;

        return '<div class="bg-white dark:bg-background-dark/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden group hover:shadow-xl transition-shadow flex flex-col">'
            + '<a href="producto.html?id=' + p.id_producto + '" class="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900 block">'
            + '<img alt="' + p.nombre + '" src="' + imagenUrl + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />'
            + stockBadge
            + '</a>'
            + '<div class="p-4 flex flex-col flex-1">'
            + '<a href="producto.html?id=' + p.id_producto + '" class="text-slate-900 dark:text-white font-medium mb-1 line-clamp-2 hover:text-primary transition-colors" title="' + p.nombre + '">' + p.nombre + '</a>'
            + '<div class="flex items-center gap-1 mb-2">'
            + '<span class="material-symbols-outlined text-primary text-sm fill-1">star</span>'
            + '<span class="material-symbols-outlined text-primary text-sm fill-1">star</span>'
            + '<span class="material-symbols-outlined text-primary text-sm fill-1">star</span>'
            + '<span class="material-symbols-outlined text-primary text-sm fill-1">star</span>'
            + '<span class="material-symbols-outlined text-slate-300 text-sm">star</span>'
            + '<span class="text-xs text-slate-500 ml-1">(' + (Math.floor(Math.random() * 500) + 15) + ')</span>'
            + '</div>'
            + '<div class="mt-auto">'
            + '<div class="flex items-baseline gap-2 mb-3">'
            + '<span class="text-2xl font-bold text-slate-900 dark:text-white">$' + formattedPrice + '</span>'
            + '</div>'
            + '<button class="w-full bg-primary text-brand-blue font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 ' + disabledClass + '" onclick="agregarAlCarrito(' + p.id_producto + ')" ' + (outOfStock ? 'disabled' : '') + '>'
            + '<span class="material-symbols-outlined text-xl">shopping_cart</span>'
            + (outOfStock ? 'No Disponible' : 'Agregar al Carrito')
            + '</button>'
            + '</div>'
            + '</div>'
            + '</div>';
    }).join('');

    console.log('Tarjetas pintadas exitosamente.');
}

/**
 * Agrega un producto al carrito (Local Storage)
 */
function agregarAlCarrito(idProducto) {
    const producto = state.productos.find(p => p.id_producto === idProducto);
    if (!producto) return;

    const itemCarrito = state.carrito.find(item => item.id_producto === idProducto);

    if (itemCarrito) {
        if (itemCarrito.cantidad < producto.stock) {
            itemCarrito.cantidad += 1;
        } else {
            console.warn('Límite de stock alcanzado para este producto.');
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

/**
 * Actualiza el contador visual del carrito en la barra
 */
function actualizarContadorCarrito() {
    if (!refs.cartCounter) return;
    const totalItems = state.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    refs.cartCounter.textContent = totalItems > 99 ? '+99' : totalItems;
}

/**
 * Muestra una notificación temporal
 */
function mostrarToast(msg) {
    if (!refs.toast) return;
    if (refs.toastMsg && msg) refs.toastMsg.textContent = msg;
    refs.toast.classList.add('show');
    setTimeout(() => { refs.toast.classList.remove('show'); }, 3000);
}

// ----------------------------------------------------
// Utilidades de UI
// ----------------------------------------------------
function mostrarLoader(isVisible) {
    if (refs.loader) refs.loader.style.display = isVisible ? 'flex' : 'none';
    if (refs.errorMsg) refs.errorMsg.classList.add('hidden');
}

function usarDatosDePrueba() {
    const mockData = [
        { id_producto: 1, nombre: 'Audífonos Premium Inalámbricos', precio: 299.00, stock: 15, imagen_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=400' },
        { id_producto: 2, nombre: 'Reloj Minimalista de Cuero 42mm', precio: 150.00, stock: 5, imagen_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=400' },
        { id_producto: 3, nombre: 'Tenis Deportivos Aero-Run', precio: 89.00, stock: 40, imagen_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400' },
        { id_producto: 4, nombre: 'Parlante Inteligente NovaLink', precio: 45.00, stock: 0, imagen_url: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&q=80&w=400' }
    ];
    state.productos = mockData;
    renderizarProductos(mockData);
}
