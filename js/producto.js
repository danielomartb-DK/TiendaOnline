/**
 * JS/Producto.js - LÃ³gica de Detalles de Producto individual
 */

document.addEventListener('DOMContentLoaded', () => {
    initProducto();
});

// Referencias del DOM y variables
const productoRefs = {
    loader: document.getElementById('loader'),
    errorMessage: document.getElementById('errorMessage'),
    container: document.getElementById('productContainer'),
    cartCounter: document.getElementById('cartCounter'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMessage')
};

let currentProduct = null;
let carritoLocal = [];

function getCartKey() {
    if (window.novaAuth && window.novaAuth.user && window.novaAuth.user.user) {
        return `PixelWear_cart_${window.novaAuth.user.user.id}`;
    }
    return 'PixelWear_cart_anon';
}

async function initProducto() {
    // 1. Cargar carrito y actualizar contador visual
    carritoLocal = JSON.parse(localStorage.getItem(getCartKey())) || [];
    actualizarContadorCarrito();

    // 2. Extraer el ID de la URL (ej: producto.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');

    if (!idProducto) {
        mostrarError();
        return;
    }

    // 3. Obtener el producto de la DB
    try {
        currentProduct = await obtenerProductoPorId(idProducto);
        if (!currentProduct) {
            mostrarError();
            return;
        }

        // 4. Renderizar la UI si todo estÃ¡ bien
        renderizarDetalles(currentProduct);

    } catch (error) {
        console.error("Error al cargar producto:", error);
        mostrarError();
    }
}

function renderizarDetalles(p) {
    productoRefs.loader.style.display = 'none';
    productoRefs.errorMessage.classList.add('hidden');
    productoRefs.container.classList.remove('hidden');

    // Cambiar dinÃ¡micamente el tÃ­tulo de la pestaÃ±a HTML
    document.title = `${p.nombre} | PixelWear`;

    const price = Number(p.precio) || 0;
    const formattedPrice = price.toLocaleString('en-US', { minimumFractionDigits: 2 });
    const stockQty = Number(p.stock) || 0;
    const outOfStock = stockQty <= 0;
    const isLowStock = stockQty > 0 && stockQty <= 5;

    let btnText = outOfStock ? 'No Disponible' : 'Añadir al Carrito';

    let stockBadge = '';
    if (outOfStock) {
        stockBadge = '<span class="inline-block bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs uppercase mb-4">Agotado Temporalmente</span>';
    } else if (isLowStock) {
        stockBadge = `<span class="inline-block bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs uppercase mb-4">Solo quedan ${stockQty} unidades</span>`;
    } else {
        stockBadge = '<span class="inline-block bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs uppercase mb-4">En Stock: Envío Inmediato</span>';
    }
    const fallbackImage = 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800';
    const imagenUrl = p.imagen_url || fallbackImage;
    const description = p.descripcion ? p.descripcion : 'Un producto premium y destacado dentro de la familia PixelWear. Construido con materiales de excelente calidad para brindar el mejor rendimiento en tu día a día.';

    productoRefs.container.innerHTML = `
        <!-- Galería (A la izquierda) -->
        <div class="flex flex-col gap-4">
            <div class="relative bg-slate-50 border border-slate-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-4">
                <img src="${imagenUrl}" alt="${p.nombre}" class="max-w-full max-h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" />
            </div>
            <!-- Thumbnails de ejemplo -->
            <div class="grid grid-cols-4 gap-2">
                <div class="aspect-square bg-slate-50 rounded-lg border-2 border-primary overflow-hidden p-1 cursor-pointer">
                    <img src="${imagenUrl}" class="w-full h-full object-contain" />
                </div>
            </div>
        </div>

        <!-- Info Principal (A la derecha) -->
        <div class="flex flex-col">
            ${stockBadge}
            <h1 class="text-3xl md:text-4xl font-black text-slate-900 mb-2 leading-tight">${p.nombre}</h1>
            
            <div class="flex items-center gap-2 mb-6">
                <div class="flex text-primary">
                    <span class="material-symbols-outlined text-lg fill-1">star</span>
                    <span class="material-symbols-outlined text-lg fill-1">star</span>
                    <span class="material-symbols-outlined text-lg fill-1">star</span>
                    <span class="material-symbols-outlined text-lg fill-1">star</span>
                    <span class="material-symbols-outlined text-lg fill-1">star_half</span>
                </div>
                <span class="text-sm text-slate-500 font-medium line-underline hover:underline cursor-pointer">Ver 120 reseñas</span>
            </div>

            <div class="mb-8">
                <p class="text-4xl font-black text-slate-900">$${formattedPrice}</p>
                <p class="text-sm text-slate-500 mt-1">Garantía de Devolución de 30 Días | Pagos Seguros</p>
            </div>

            <div class="mb-8 border-t border-b border-slate-100 py-6">
                <h3 class="font-bold text-slate-900 mb-2">Acerca de este artículo</h3>
                <p class="text-slate-600 leading-relaxed text-sm">${description}</p>
            </div>

            <!-- Botón de Compra -->
            <div class="flex flex-col gap-3 mt-auto">
                <button 
                    id="btnAgregar"
                    class="w-full py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${btnClass}" 
                    ${outOfStock ? 'disabled' : ''}
                    onclick="agregarAlCarritoLocal(${p.id_producto})"
                >
                    <span class="material-symbols-outlined">shopping_cart</span>
                    ${btnText}
                </button>
                <div class="flex items-center gap-4 text-xs text-slate-500 justify-center mt-2 font-medium">
                    <div class="flex items-center gap-1"><span class="material-symbols-outlined text-[1rem]">verified</span> Compra Segura PixelWear</div>
                    <div class="flex items-center gap-1"><span class="material-symbols-outlined text-[1rem]">local_shipping</span> Envío Gratis a nivel nacional</div>
                </div>
            </div>
        </div>
    `;
}

function mostrarError() {
    productoRefs.loader.style.display = 'none';
    productoRefs.container.classList.add('hidden');
    productoRefs.errorMessage.classList.remove('hidden');
}

/**
 * Agrega el producto al carrito de compras desde esta vista.
 */
function agregarAlCarritoLocal(idProducto) {
    if (!currentProduct || currentProduct.stock <= 0) return;

    const itemCarrito = carritoLocal.find(item => item.id_producto === idProducto);

    if (itemCarrito) {
        if (itemCarrito.cantidad < currentProduct.stock) {
            itemCarrito.cantidad += 1;
        } else {
            alert('Has alcanzado el límite máximo de stock para este producto.');
            return;
        }
    } else {
        carritoLocal.push({
            id_producto: currentProduct.id_producto,
            nombre: currentProduct.nombre,
            precio: Number(currentProduct.precio),
            imagen_url: currentProduct.imagen_url,
            cantidad: 1,
            stock: currentProduct.stock
        });
    }

    localStorage.setItem(getCartKey(), JSON.stringify(carritoLocal));
    actualizarContadorCarrito();
    mostrarToast('¡Listo! Agregado a tu carrito.');
}

function actualizarContadorCarrito() {
    if (!productoRefs.cartCounter) return;
    const totalItems = carritoLocal.reduce((acc, item) => acc + item.cantidad, 0);
    productoRefs.cartCounter.textContent = totalItems > 99 ? '+99' : totalItems;
}

function mostrarToast(msg) {
    if (!productoRefs.toast) return;
    if (productoRefs.toastMsg && msg) productoRefs.toastMsg.textContent = msg;
    productoRefs.toast.classList.add('show');
    setTimeout(() => { productoRefs.toast.classList.remove('show'); }, 3000);
}

