/**
 * JS/Carrito.js - Lógica del Carrito y Checkout
 * Maneja la edición del carrito, validación del formulario y venta.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCarrito();
});

// Función auxiliar para obtener la key del carrito basada en el usuario actual
function getCartKey() {
    if (window.novaAuth && window.novaAuth.user && window.novaAuth.user.user) {
        return `PixelWear_cart_${window.novaAuth.user.user.id}`;
    }
    return 'PixelWear_cart_anon';
}

// Estado del carrito (se inicializa vacío y se carga en initCarrito para asegurar que novaAuth esté listo)
const cart = {
    items: []
};

// Referencias DOM
const cartRefs = {
    itemsContainer: document.getElementById('cartItems'),
    emptyCart: document.getElementById('emptyCart'),
    orderSummary: document.getElementById('orderSummary'),
    itemCount: document.getElementById('itemCount'),
    subtotal: document.getElementById('subtotal'),
    total: document.getElementById('total'),
    form: document.getElementById('checkoutForm'),
    btnCheckout: document.getElementById('btnCheckout'),
    checkoutSuccess: document.getElementById('checkoutSuccess')
};

/**
 * Inicializa el Módulo del Carrito
 */
function initCarrito() {
    // Cargar items del storage correspondiente al usuario actual
    cart.items = JSON.parse(localStorage.getItem(getCartKey())) || [];

    renderizarItems();
    calcularTotales();

    // Autocompletar datos del cliente si está autenticado
    if (window.novaAuth && window.novaAuth.user && window.novaAuth.user.user) {
        const currentUser = window.novaAuth.user.user;
        const emailInput = document.querySelector('input[name="email"]');
        if (emailInput) {
            emailInput.value = currentUser.email;
            emailInput.readOnly = true;
            emailInput.classList.add('opacity-70', 'cursor-not-allowed', 'bg-slate-100');
        }
        if (currentUser.user_metadata && currentUser.user_metadata.name) {
            const parts = currentUser.user_metadata.name.split(' ');
            const nombresInput = document.querySelector('input[name="nombres"]');
            const apellidosInput = document.querySelector('input[name="apellidos"]');
            if (nombresInput && !nombresInput.value) nombresInput.value = parts[0];
            if (apellidosInput && parts.length > 1 && !apellidosInput.value) {
                apellidosInput.value = parts.slice(1).join(' ');
            }
        }
    }

    // Binding del formulario
    if (cartRefs.form) {
        cartRefs.form.addEventListener('submit', handleCheckoutSubmit);
    }
}

/**
 * Renderiza las tarjetas de cada item del carrito
 */
function renderizarItems() {
    if (cart.items.length === 0) {
        cartRefs.itemsContainer.innerHTML = '';
        cartRefs.emptyCart.classList.remove('hidden');
        if (cartRefs.orderSummary) cartRefs.orderSummary.classList.add('hidden');
        return;
    }

    cartRefs.emptyCart.classList.add('hidden');
    if (cartRefs.orderSummary) cartRefs.orderSummary.classList.remove('hidden');

    cartRefs.itemsContainer.innerHTML = cart.items.map(item => {
        const itemTotal = window.CurrencyManager ? window.CurrencyManager.formatPrice(item.precio * item.cantidad) : '$' + (item.precio * item.cantidad).toLocaleString('en-US', { minimumFractionDigits: 2 });
        const unitPrice = window.CurrencyManager ? window.CurrencyManager.formatPrice(item.precio) : '$' + item.precio.toLocaleString('en-US', { minimumFractionDigits: 2 });
        const imgUrl = item.imagen_url || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=200';

        return '<div class="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-center shadow-sm">'
            + '<img src="' + imgUrl + '" alt="' + item.nombre + '" class="w-20 h-20 object-cover rounded-lg flex-shrink-0" />'
            + '<div class="flex-1 min-w-0">'
            + '<h4 class="font-medium text-sm text-slate-900 truncate">' + item.nombre + '</h4>'
            + '<p class="text-xs text-slate-400 mt-1">Precio unit.: ' + unitPrice + '</p>'
            + '<div class="flex items-center gap-2 mt-2">'
            + '<button onclick="cambiarCantidad(' + item.id_producto + ', -1)" class="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">−</button>'
            + '<span class="text-sm font-bold w-6 text-center">' + item.cantidad + '</span>'
            + '<button onclick="cambiarCantidad(' + item.id_producto + ', 1)" class="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">+</button>'
            + '</div>'
            + '</div>'
            + '<div class="text-right flex-shrink-0">'
            + '<p class="font-bold text-lg text-slate-900">' + itemTotal + '</p>'
            + '<button onclick="eliminarItem(' + item.id_producto + ')" class="text-red-500 hover:text-red-700 text-xs mt-2 flex items-center gap-1 ml-auto">'
            + '<span class="material-symbols-outlined text-sm">delete</span> Quitar'
            + '</button>'
            + '</div>'
            + '</div>';
    }).join('');
}

/**
 * Cambia la cantidad de un item
 */
function cambiarCantidad(idProducto, delta) {
    const item = cart.items.find(i => i.id_producto === idProducto);
    if (!item) return;

    item.cantidad += delta;
    if (item.cantidad <= 0) {
        cart.items = cart.items.filter(i => i.id_producto !== idProducto);
    } else if (item.cantidad > item.stock) {
        item.cantidad = item.stock;
    }

    guardarCarrito();
    renderizarItems();
    calcularTotales();
}

/**
 * Elimina un item del carrito
 */
function eliminarItem(idProducto) {
    cart.items = cart.items.filter(i => i.id_producto !== idProducto);
    guardarCarrito();
    renderizarItems();
    calcularTotales();
}

/**
 * Calcula y muestra los totales
 */
function calcularTotales() {
    const totalItems = cart.items.reduce((acc, i) => acc + i.cantidad, 0);
    const subtotal = cart.items.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);

    if (cartRefs.itemCount) cartRefs.itemCount.textContent = totalItems;
    if (cartRefs.subtotal) cartRefs.subtotal.textContent = window.CurrencyManager ? window.CurrencyManager.formatPrice(subtotal) : '$' + subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 });
    if (cartRefs.total) cartRefs.total.textContent = window.CurrencyManager ? window.CurrencyManager.formatPrice(subtotal) : '$' + subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

/**
 * Guarda el carrito en localStorage
 */
function guardarCarrito() {
    localStorage.setItem(getCartKey(), JSON.stringify(cart.items));
}

/**
 * Maneja el submit del checkout
 */
async function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (cart.items.length === 0) {
        alert('Tu carrito está vacío.');
        return;
    }

    const formData = new FormData(e.target);
    const datosCliente = {
        nombres: formData.get('nombres'),
        apellidos: formData.get('apellidos'),
        email: formData.get('email'),
        documento: formData.get('documento'),
        telefono: formData.get('telefono') || '',
        direccion: formData.get('direccion')
    };

    cartRefs.btnCheckout.disabled = true;
    cartRefs.btnCheckout.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Procesando...';

    try {
        // 1. Registrar cliente
        const cliente = await registrarCliente(datosCliente);
        const clienteId = cliente ? cliente.id_cliente : null;

        // 2. Crear la venta
        const subtotal = cart.items.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
        const venta = await registrarVenta({
            id_cliente: clienteId,
            total: subtotal,
            estado: 'pendiente'
        });

        // 3. Registrar detalles
        if (venta && venta.id_venta) {
            const detalles = cart.items.map(item => ({
                id_venta: venta.id_venta,
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                subtotal: item.precio * item.cantidad
            }));
            await registrarDetallesVenta(detalles);
        }

        // 4. Éxito
        cart.items = [];
        guardarCarrito();
        cartRefs.form.classList.add('hidden');
        cartRefs.checkoutSuccess.classList.remove('hidden');
        alert('¡Pedido procesado con éxito!');
        renderizarItems();
        calcularTotales();

    } catch (error) {
        console.error('Error en checkout:', error);
        alert('Hubo un error al procesar tu pedido:\n' + error.message);
        cartRefs.btnCheckout.disabled = false;
        cartRefs.btnCheckout.innerHTML = '<span class="material-symbols-outlined">lock</span> Realizar Pedido';
    }
}
