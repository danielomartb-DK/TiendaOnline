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

function mostrarToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const icon = toast ? toast.querySelector('.material-symbols-outlined') : null;

    if (!toast) {
        // Fallback simple si el toast no está en el DOM
        console.log("Toast:", msg);
        alert(msg);
        return;
    }

    if (toastMsg) toastMsg.textContent = msg;

    // Resetear clases
    toast.className = 'toast show';
    toast.classList.add(type);

    if (icon) {
        if (type === 'error') icon.textContent = 'error';
        else if (type === 'info') icon.textContent = 'info';
        else icon.textContent = 'check_circle';
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

async function initProducto() {
    // 1. Cargar carrito y actualizar contador visual
    carritoLocal = JSON.parse(localStorage.getItem(getCartKey())) || [];
    actualizarContadorCarrito();

    // 2. Extraer el ID de la URL (ej: producto.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');

    if (!idProducto) {
        mostrarError("Error Técnico: No se detectó un ID de producto válido en el enlace de la URL.");
        return;
    }

    // 3. Obtener el producto de la DB
    try {
        currentProduct = await obtenerProductoPorId(idProducto);
        if (!currentProduct) {
            mostrarError(`Error Técnico: Supabase devolvió vacío (Null) para el Producto ID #${idProducto}`);
            return;
        }

        // 4. Renderizar la UI si todo está bien
        renderizarDetalles(currentProduct);

        // 5. Cargar Reseñas
        initResenas(idProducto);

    } catch (error) {
        console.error("Error al cargar producto:", error);
        mostrarError(`Excepción de Red/CORS consultando ID #${idProducto}: ${error.message}`);
    }
}

function renderizarDetalles(p) {
    productoRefs.loader.style.display = 'none';
    productoRefs.errorMessage.classList.add('hidden');
    productoRefs.container.classList.remove('hidden');

    // Cambiar dinÃ¡micamente el tÃ­tulo de la pestaÃ±a HTML
    document.title = `${p.nombre} | PixelWear`;

    const price = Number(p.precio) || 0;
    const formattedPrice = window.CurrencyManager ? window.CurrencyManager.formatPrice(price) : '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2 });
    const stockQty = Number(p.stock) || 0;
    const outOfStock = stockQty <= 0;
    const isLowStock = stockQty > 0 && stockQty <= 5;
    let btnClass = outOfStock ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-orange-600 dark:from-cyan-500 dark:to-blue-600 text-white hover:brightness-110 shadow-orange-500/30 dark:shadow-cyan-500/30';
    let btnText = outOfStock ? 'No Disponible' : 'Añadir al Carrito';

    let stockBadge = '';
    if (outOfStock) {
        stockBadge = '<span class="inline-block bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs uppercase mb-4">Agotado Temporalmente</span>';
    } else if (isLowStock) {
        stockBadge = `<span class="inline-block bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs uppercase mb-4">Solo quedan ${stockQty} unidades</span>`;
    } else {
        stockBadge = '<span class="inline-block bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs uppercase mb-4">En Stock: Envío Inmediato</span>';
    }

    // Agregar indicador exclusivo de Stock para el Admin, por encima del badge normal de usuario
    if (window.novaAuth && window.novaAuth.isAdmin()) {
        stockBadge = `<span class="inline-block bg-slate-900 border border-cyan-500 shadow-[0_0_10px_rgba(0,183,255,0.2)] text-cyan-400 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase mb-4 mr-2"><span class="material-symbols-outlined text-[12px] mr-1 align-middle">inventory_2</span>Stock Físico (BBDD): ${stockQty} unds</span>` + stockBadge;
    }

    const fallbackImage = 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800';
    const imagenUrl = p.imagen_url || fallbackImage;
    const description = p.descripcion ? p.descripcion : 'Un producto premium y destacado dentro de la familia PixelWear. Construido con materiales de excelente calidad para brindar el mejor rendimiento en tu día a día.';

    let adminPanelHtml = '';
    if (window.novaAuth && window.novaAuth.isAdmin()) {
        const eyeIcon = p.estado ? 'visibility' : 'visibility_off';
        const eyeColor = p.estado ? 'text-green-500' : 'text-slate-500';
        const eyeTooltip = p.estado ? 'Visible en tienda' : 'Oculto en tienda';

        adminPanelHtml = `
            <div class="mt-8 p-6 bg-slate-900 border-2 border-cyan-500 rounded-xl shadow-[0_0_20px_rgba(0,183,255,0.1)] col-span-1 md:col-span-2">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-white flex items-center gap-2">
                        <span class="material-symbols-outlined text-cyan-400">admin_panel_settings</span> Editor en Vivo
                    </h3>
                    <button onclick="toggleVisibilidadProducto(${p.id_producto}, ${!p.estado})" title="${eyeTooltip}" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 ${eyeColor}">
                        <span class="material-symbols-outlined">${eyeIcon}</span>
                        <span class="text-xs font-bold">${p.estado ? 'Público' : 'Oculto'}</span>
                    </button>
                </div>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="text-xs text-slate-400 font-bold uppercase track">Nombre del Producto</label>
                        <input type="text" id="editNombre" class="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 outline-none focus:border-cyan-500 mt-1" value="${p.nombre}">
                    </div>
                    <div>
                         <label class="text-xs text-slate-400 font-bold uppercase track">Descripción</label>   
                         <textarea id="editDesc" class="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 outline-none focus:border-cyan-500 mt-1" rows="4">${description}</textarea>
                    </div>
                    <div class="flex gap-4">
                        <div class="flex-1">
                            <label class="text-xs text-slate-400 font-bold uppercase track">Precio (${window.CurrencyManager ? window.CurrencyManager.getCurrencySymbol() : 'Base'})</label>
                            <input type="number" id="editPrecio" class="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 outline-none focus:border-cyan-500 mt-1" value="${window.CurrencyManager ? window.CurrencyManager.fromBase(p.precio).toFixed(0) : p.precio}">
                        </div>
                        <div class="flex-1">
                            <label class="text-xs text-slate-400 font-bold uppercase track">Unidades Stock</label>
                            <input type="number" id="editStock" class="w-full bg-slate-800 text-white rounded-lg p-3 border border-slate-700 outline-none focus:border-cyan-500 mt-1" value="${p.stock}">
                        </div>
                    </div>
                    <div>
                        <label class="text-xs text-slate-400 font-bold uppercase track">Reemplazar Imagen (Opcional)</label>
                        <input type="file" id="editImagen" class="w-full text-slate-300 rounded-lg p-2 border border-slate-700 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-brand-blue hover:file:bg-cyan-400 cursor-pointer" accept="image/*">
                    </div>
                    <div class="flex flex-col md:flex-row gap-4 mt-4">
                        <button onclick="guardarEdicion(${p.id_producto})" class="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg">
                            <span class="material-symbols-outlined font-bold">save</span> Guardar Cambios
                        </button>
                        <button onclick="borrarProductoActual(${p.id_producto})" class="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500 font-bold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg group">
                            <span class="material-symbols-outlined font-bold group-hover:animate-bounce">delete</span> Eliminar Ítem
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    productoRefs.container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Galería (A la izquierda) -->
            <div class="flex flex-col gap-4">
                <div class="relative bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-4 transition-colors duration-300">
                    <img src="${imagenUrl}" alt="${p.nombre}" class="max-w-full max-h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" />
                </div>
                <!-- Thumbnails de ejemplo -->
                <div class="grid grid-cols-4 gap-2">
                    <div class="aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-primary overflow-hidden p-1 cursor-pointer transition-colors duration-300">
                        <img src="${imagenUrl}" class="w-full h-full object-contain" />
                    </div>
                </div>
            </div>

            <!-- Info Principal (A la derecha) -->
            <div class="flex flex-col">
                ${stockBadge}
                <h1 class="text-3xl md:text-4xl font-mecha font-bold text-slate-900 dark:text-white mb-2 leading-tight transition-colors duration-300 uppercase tracking-wide">${p.nombre}</h1>
                
                <div class="flex items-center gap-2 mb-6">
                    <div class="flex text-primary" id="avgStarsContainer">
                        <!-- Estrellas dinámicas -->
                        <span class="material-symbols-outlined text-lg">star</span>
                        <span class="material-symbols-outlined text-lg">star</span>
                        <span class="material-symbols-outlined text-lg">star</span>
                        <span class="material-symbols-outlined text-lg">star</span>
                        <span class="material-symbols-outlined text-lg">star</span>
                    </div>
                    <span id="avgReviewsText" class="text-sm text-slate-500 font-medium line-underline hover:underline cursor-pointer">Cargando reseñas...</span>
                </div>

                <div class="mb-8">
                    <p class="text-4xl font-mecha font-bold text-slate-900 dark:text-white transition-colors duration-300 tracking-wide">${formattedPrice}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-300">Garantía de Devolución de 30 Días | Pagos Seguros</p>
                </div>

                <div class="mb-8 border-t border-b border-slate-100 dark:border-slate-800 py-6 transition-colors duration-300">
                    <h3 class="font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-300">Acerca de este artículo</h3>
                    <p class="text-slate-600 dark:text-slate-400 leading-relaxed text-sm transition-colors duration-300">${description}</p>
                </div>

                <!-- Selector de Tallas -->
                <div class="mb-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs transition-colors duration-300">Seleccionar Talla (Nivel de Armadura)</h3>
                        <a href="#" class="text-[10px] text-cyan-500 font-bold hover:underline uppercase tracking-tighter">Guía de Tallas</a>
                    </div>
                    <div class="flex flex-wrap gap-3" id="tallaSelector">
                        ${['S', 'M', 'L', 'XL', 'XXL'].map(t => `
                            <button 
                                onclick="seleccionarTalla('${t}')"
                                class="talla-btn w-12 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-sm flex items-center justify-center transition-all hover:border-primary dark:hover:border-cyan-500 text-slate-600 dark:text-slate-400"
                                data-talla="${t}"
                            >${t}</button>
                        `).join('')}
                    </div>
                    <p id="tallaError" class="text-[10px] text-red-500 font-bold mt-2 hidden uppercase tracking-widest animate-pulse">¡ERROR! Selecciona tu talla para sincronizar el equipo.</p>
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
        </div>

        <!-- Renderizado Condicional del Editor de Admin -->
        ${adminPanelHtml}
    `;
}

function mostrarError(mensajeDebug = "El producto que buscas no existe o ha sido retirado.") {
    productoRefs.loader.style.display = 'none';
    productoRefs.container.classList.add('hidden');
    productoRefs.errorMessage.classList.remove('hidden');

    // Inyectar el log de error en la etiqueta <p> para alertar al cliente del por qué
    const textError = productoRefs.errorMessage.querySelector('p');
    if (textError) textError.textContent = mensajeDebug;
}

let tallaSeleccionada = null;

function seleccionarTalla(talla) {
    tallaSeleccionada = talla;

    // UI Update
    document.querySelectorAll('.talla-btn').forEach(btn => {
        btn.classList.remove('border-primary', 'dark:border-cyan-500', 'bg-primary/10', 'dark:bg-cyan-500/10', 'text-primary', 'dark:text-cyan-400');
        btn.classList.add('border-slate-200', 'dark:border-slate-700', 'text-slate-600', 'dark:text-slate-400');
    });

    const selectedBtn = document.querySelector(`.talla-btn[data-talla="${talla}"]`);
    if (selectedBtn) {
        selectedBtn.classList.remove('border-slate-200', 'dark:border-slate-700', 'text-slate-600', 'dark:text-slate-400');
        selectedBtn.classList.add('border-primary', 'dark:border-cyan-500', 'bg-primary/10', 'dark:bg-cyan-500/10', 'text-primary', 'dark:text-cyan-400');
    }

    // Ocultar error si existía
    const errorMsg = document.getElementById('tallaError');
    if (errorMsg) errorMsg.classList.add('hidden');
}

/**
 * Agrega el producto al carrito de compras desde esta vista.
 */
function agregarAlCarritoLocal(idProducto) {
    if (!currentProduct || currentProduct.stock <= 0) return;

    // Validación de Talla
    if (!tallaSeleccionada) {
        const errorMsg = document.getElementById('tallaError');
        if (errorMsg) {
            errorMsg.classList.remove('hidden');
            // Scroll suave al error
            errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        mostrarToast('¡ERROR DE SINCRONIZACIÓN! Selecciona tu talla.', 'error');
        return;
    }

    // Buscamos si ya existe el mismo producto CON LA MISMA TALLA
    const itemCarrito = carritoLocal.find(item => item.id_producto === idProducto && item.talla === tallaSeleccionada);

    if (itemCarrito) {
        if (itemCarrito.cantidad < currentProduct.stock) {
            itemCarrito.cantidad += 1;
        } else {
            mostrarToast('Has alcanzado el límite máximo de stock para este producto.', 'error');
            return;
        }
    } else {
        carritoLocal.push({
            id_producto: currentProduct.id_producto,
            nombre: currentProduct.nombre,
            precio: Number(currentProduct.precio),
            imagen_url: currentProduct.imagen_url,
            cantidad: 1,
            stock: currentProduct.stock,
            talla: tallaSeleccionada
        });
    }

    localStorage.setItem(getCartKey(), JSON.stringify(carritoLocal));
    actualizarContadorCarrito();
    mostrarToast('¡Listo! Equipo sincronizado talla ' + tallaSeleccionada);
}

function actualizarContadorCarrito() {
    if (!productoRefs.cartCounter) return;
    const totalItems = carritoLocal.reduce((acc, item) => acc + item.cantidad, 0);
    productoRefs.cartCounter.textContent = totalItems > 99 ? '+99' : totalItems;
}


// --- CONTROLES DE ADMINISTRADOR --- //

async function guardarEdicion(id_producto) {
    if (!window.novaAuth || !window.novaAuth.isAdmin()) {
        alert("Acceso denegado: Se requiere estatus de Administrador.");
        return;
    }

    const btn = document.querySelector(`button[onclick="guardarEdicion(${id_producto})"]`);
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Subiendo...';
    btn.disabled = true;
    btn.classList.add('opacity-70', 'cursor-not-allowed');

    try {
        const nombre = document.getElementById('editNombre').value;
        const descripcion = document.getElementById('editDesc').value;
        const rawPrecio = Number(document.getElementById('editPrecio').value);
        const precioBase = window.CurrencyManager ? window.CurrencyManager.toBase(rawPrecio) : rawPrecio;
        const stock = Number(document.getElementById('editStock').value);
        const fileInput = document.getElementById('editImagen');

        const updates = { nombre, descripcion, precio: precioBase, stock };

        // Si se seleccionó una imagen nueva, usar el API endpoint para subir a Bucket storage
        if (fileInput.files.length > 0) {
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin">cloud_upload</span> Cifrando Foto...';
            const imgUrl = await subirFotoProducto(fileInput.files[0]);
            updates.imagen_url = imgUrl; // Agregando la URL a los updates
        }

        await actualizarProducto(id_producto, updates);
        mostrarToast('Cambios guardados con éxito.');
        setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
        mostrarToast('Error al modificar producto: ' + e.message, 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
}

async function borrarProductoActual(id_producto) {
    if (!window.novaAuth || !window.novaAuth.isAdmin()) return;

    const confirmado = await window.pixelConfirm('¿Estás totalmente seguro de RETIRAR este producto de PixelWear? Esta acción es instantánea y no puede deshacerse.', {
        titulo: '🛑 Eliminar Producto',
        btnConfirm: 'Sí, Eliminar',
        tipo: 'danger'
    });
    if (!confirmado) return;

    const btn = document.querySelector(`button[onclick^="borrarProductoActual(${id_producto})"]`);
    if (btn) {
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Destruyendo...';
        btn.disabled = true;
    }

    try {
        const result = await eliminarProducto(id_producto);
        if (result === true) {
            mostrarToast('Producto eliminado definitivamente.');
        } else {
            mostrarToast('Producto removido del catálogo (Oculto).', 'info');
        }
        setTimeout(() => window.location.href = 'index.html', 1500);
    } catch (e) {
        mostrarToast('Error al purgar de DB: ' + e.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined font-bold group-hover:animate-bounce">delete</span> Eliminar Ítem';
    }
}

async function toggleVisibilidadProducto(id_producto, mostrar) {
    if (!window.novaAuth || !window.novaAuth.isAdmin()) return;

    try {
        await actualizarProducto(id_producto, { estado: mostrar });
        mostrarToast(mostrar ? 'Producto ahora es visible' : 'Producto ocultado de la tienda');
        setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
        mostrarToast('Error al cambiar visibilidad: ' + e.message, 'error');
    }
}

// --- SISTEMA DE RESEÑAS --- //

let selectedRating = 0;
let listaResenasLocal = [];
let resenasVisibles = 4;
const resenasPorCarga = 4;

async function initResenas(idProducto) {
    try {
        resenasVisibles = resenasPorCarga;
        listaResenasLocal = await obtenerResenasPorProducto(idProducto);
        renderizarResenas();
        actualizarPromedioEstrellas();
    } catch (e) {
        console.error("Error al cargar reseñas:", e);
    }
}

function renderizarResenas() {
    const container = document.getElementById('reviewsList');
    const loadMoreContainer = document.getElementById('loadMoreResenasContainer');
    if (!container) return;

    if (listaResenasLocal.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-10 text-center border border-slate-100 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-800/30">
                <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">auto_stories</span>
                <p class="text-slate-500 italic text-sm">Aún no hay registros de batalla para este ítem. ¡Sé el primero!</p>
            </div>
        `;
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
        return;
    }

    // Paginación visual (Slice)
    const parcial = listaResenasLocal.slice(0, resenasVisibles);

    container.innerHTML = parcial.map(r => {
        const estrellas = Array(5).fill(0).map((_, i) => {
            const icon = i < r.calificacion ? 'star' : 'star_border';
            const fillClass = i < r.calificacion ? 'fill-1' : '';
            return `<span class="material-symbols-outlined text-sm ${fillClass}">${icon}</span>`;
        }).join('');

        const autor = r.cliente ? `${r.cliente.nombres} ${r.cliente.apellidos}` : (r.nombres_anonimo || 'Cazador Anónimo');
        const fecha = new Date(r.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

        // Foto de la reseña
        const fotoHtml = r.foto_url ? `
            <div class="mt-4 mb-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                <img src="${r.foto_url}" alt="Evidencia de caza" class="w-full h-auto max-h-64 object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" onclick="window.open('${r.foto_url}', '_blank')">
            </div>
        ` : '';

        return `
            <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex flex-col">
                        <span class="font-bold text-slate-800 dark:text-white text-sm">${autor}</span>
                        <span class="text-[10px] text-slate-400 uppercase tracking-tighter">${fecha}</span>
                    </div>
                    <div class="flex text-primary">
                        ${estrellas}
                    </div>
                </div>
                ${fotoHtml}
                <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">"${r.comentario}"</p>
            </div>
        `;
    }).join('');

    // Mostrar/Ocultar botón de ver más
    if (loadMoreContainer) {
        if (listaResenasLocal.length > resenasVisibles) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
    }
}

/**
 * Carga el siguiente bloque de reseñas
 */
function cargarMasResenas() {
    resenasVisibles += resenasPorCarga;
    renderizarResenas();
}

function actualizarPromedioEstrellas() {
    const container = document.getElementById('avgStarsContainer');
    const text = document.getElementById('avgReviewsText');
    if (!container || !text) return;

    if (listaResenasLocal.length === 0) {
        text.textContent = "Sin reseñas aún";
        return;
    }

    const suma = listaResenasLocal.reduce((acc, r) => acc + r.calificacion, 0);
    const promedio = (suma / listaResenasLocal.length).toFixed(1);

    let estrellasHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(promedio)) {
            estrellasHtml += '<span class="material-symbols-outlined text-lg fill-1">star</span>';
        } else if (i === Math.ceil(promedio) && promedio % 1 !== 0) {
            estrellasHtml += '<span class="material-symbols-outlined text-lg fill-1">star_half</span>';
        } else {
            estrellasHtml += '<span class="material-symbols-outlined text-lg">star</span>';
        }
    }

    container.innerHTML = estrellasHtml;
    text.textContent = `Basado en ${listaResenasLocal.length} informe(s)`;
}

function toggleFomularioResena() {
    const form = document.getElementById('reviewFormContainer');
    if (form) {
        form.classList.toggle('hidden');
        if (!form.classList.contains('hidden')) {
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function setRating(n) {
    selectedRating = n;
    const starBtns = document.querySelectorAll('.star-btn span');
    starBtns.forEach((span, i) => {
        if (i < n) {
            span.textContent = 'star';
            span.classList.add('fill-1', 'text-primary');
            span.classList.remove('text-slate-300');
        } else {
            span.textContent = 'star';
            span.classList.remove('fill-1', 'text-primary');
            span.classList.add('text-slate-300');
        }
    });
}

function removeReviewPhoto() {
    const input = document.getElementById('reviewPhoto');
    const preview = document.getElementById('photoPreviewContainer');
    const label = document.getElementById('photoLabel');
    if (input) input.value = '';
    if (preview) preview.classList.add('hidden');
    if (label) label.textContent = 'Subir evidencia';
}

function previewReviewPhoto(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('photoPreviewContainer');
    const previewImg = document.getElementById('photoPreview');
    const label = document.getElementById('photoLabel');

    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            mostrarToast('La imagen es muy pesada. Máximo 2MB.', 'error');
            removeReviewPhoto();
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            previewContainer.classList.remove('hidden');
            label.textContent = 'Imagen lista';
        };
        reader.readAsDataURL(file);
    }
}

async function enviarResena() {
    const nombre = document.getElementById('reviewName').value.trim();
    const comentario = document.getElementById('reviewComment').value.trim();
    const photoInput = document.getElementById('reviewPhoto');
    const btn = document.getElementById('btnSubmitReview');

    if (selectedRating === 0) {
        mostrarToast('Por favor selecciona un nivel de estrellas', 'error');
        return;
    }
    if (!comentario) {
        mostrarToast('El informe está vacío. Cuéntanos qué tal el equipo.', 'error');
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> Enviando...';
    btn.disabled = true;

    try {
        let fotoUrl = null;
        if (photoInput.files && photoInput.files[0]) {
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> Subiendo evidencia...';
            fotoUrl = await subirFotoResena(photoInput.files[0]);
        }

        const id_producto = new URLSearchParams(window.location.search).get('id');
        const resena = {
            id_producto: parseInt(id_producto),
            calificacion: selectedRating,
            comentario: comentario,
            nombres_anonimo: nombre || 'Cazador Anónimo',
            foto_url: fotoUrl
        };

        // Si hay una sesión activa, asociar el id_cliente
        if (window.novaAuth && window.novaAuth.user && window.novaAuth.user.perfil) {
            resena.id_cliente = window.novaAuth.user.perfil.id_cliente;
        }

        await crearResena(resena);
        mostrarToast('¡Tu informe ha sido publicado con éxito!');

        // Resetear y cerrar
        document.getElementById('reviewName').value = '';
        document.getElementById('reviewComment').value = '';
        removeReviewPhoto();
        setRating(0);
        toggleFomularioResena();

        // Recargar lista
        initResenas(id_producto);

    } catch (e) {
        mostrarToast('Error al publicar: ' + e.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
