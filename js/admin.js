/**
 * JS/Admin.js - Lógica del Panel de Administración
 * Permite a los administradores subir nuevos productos con imágenes y gestionar el catálogo/pedidos.
 */

document.addEventListener('DOMContentLoaded', () => {
    initAdminPanel();
});

async function initAdminPanel() {
    // 1. Verificar Seguridad
    let checkInterval = setInterval(() => {
        if (window.novaAuth && !window.novaAuth._refreshing) {
            clearInterval(checkInterval);
            if (!window.novaAuth.isAdmin()) {
                document.body.innerHTML = `
                    <div class="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-center transition-colors">
                        <div class="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-red-200 dark:border-red-900 mx-4">
                            <span class="material-symbols-outlined text-6xl text-red-500 mb-4 block">gpp_maybe</span>
                            <h1 class="text-2xl font-black text-slate-800 dark:text-white mb-2">Acceso Denegado</h1>
                            <p class="text-slate-500 dark:text-slate-400 mb-6">Esta área es exclusiva para cuentas de Administrador.</p>
                            <a href="index.html" class="bg-primary text-brand-blue font-bold px-6 py-2 rounded-lg hover:brightness-110 transition-all text-sm">Volver a la Tienda</a>
                        </div>
                    </div>
                `;
            } else {
                bindAdminEvents();
            }
        }
    }, 50);

    async function bindAdminEvents() {
        // Actualizar símbolo de moneda en label de precio
        const labelPrecio = document.querySelector('label[for="prodPrecio"]');
        if (labelPrecio && window.CurrencyManager) {
            labelPrecio.textContent = `Precio (${window.CurrencyManager.getCurrencySymbol()})`;
        }

        // --- Estado Global ---
        let ventasGlobales = [];
        let filtroActual = 'pendiente'; // 'pendiente', 'entregado', 'cancelado', 'catalogo'

        // Referencias DOM
        const btnTabPendientes = document.getElementById('tabPendientes');
        const btnTabEntregados = document.getElementById('tabEntregados');
        const btnTabCancelados = document.getElementById('tabCancelados');
        const btnTabCatalogo = document.getElementById('tabCatalogo');

        const containerPedidos = document.getElementById('containerPedidos');
        const containerCatalogo = document.getElementById('containerCatalogo');

        const form = document.getElementById('adminProductForm');
        const inputImagen = document.getElementById('prodImagen');
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        const btnSubmit = document.getElementById('btnSubmitProducto');

        // --- Lógica del Formulario de Productos ---
        if (inputImagen) inputImagen.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                fileNameDisplay.textContent = e.target.files[0].name;
                fileNameDisplay.classList.add('text-primary');
            } else {
                fileNameDisplay.textContent = '';
            }
        });

        if (form) form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = inputImagen.files[0];
            if (!file) {
                mostrarToast('Selecciona una imagen.', 'error');
                return;
            }

            btnSubmit.disabled = true;
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = 'Subiendo...';

            try {
                const rawPrecio = parseFloat(document.getElementById('prodPrecio').value);
                const precioBase = window.CurrencyManager ? window.CurrencyManager.toBase(rawPrecio) : rawPrecio;

                const nuevoProducto = {
                    nombre: document.getElementById('prodNombre').value.trim(),
                    precio: precioBase,
                    stock: parseInt(document.getElementById('prodStock').value),
                    descripcion: document.getElementById('prodDesc').value.trim(),
                    imagen_url: urlImagen,
                    estado: true,
                    id_tipo_producto: 1,
                    codigo: 'PROD-' + Math.random().toString(36).substring(2, 8).toUpperCase()
                };

                await crearProducto(nuevoProducto);
                form.reset();
                fileNameDisplay.textContent = '';
                mostrarToast('Producto creado con éxito.');
                if (filtroActual === 'catalogo') await cargarYRenderizarCatalogo();
            } catch (err) {
                mostrarToast(err.message, 'error');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalText;
            }
        });

        // --- Lógica de Pestañas ---
        function resetTabStyles() {
            const tabs = [btnTabPendientes, btnTabEntregados, btnTabCancelados, btnTabCatalogo].filter(Boolean);
            tabs.forEach(tab => {
                tab.className = "px-6 py-2 rounded-lg font-bold transition-all bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 flex items-center gap-2";
            });
        }

        if (btnTabPendientes) btnTabPendientes.addEventListener('click', async () => {
            filtroActual = 'pendiente';
            containerPedidos.classList.remove('hidden');
            containerCatalogo.classList.add('hidden');
            resetTabStyles();
            btnTabPendientes.className = "px-6 py-2 rounded-lg font-bold transition-all bg-brand-blue dark:bg-primary text-white dark:text-brand-blue shadow-md border border-transparent flex items-center gap-2";
            await cargarVentasYRenderizar();
        });

        if (btnTabEntregados) btnTabEntregados.addEventListener('click', async () => {
            filtroActual = 'entregado';
            containerPedidos.classList.remove('hidden');
            containerCatalogo.classList.add('hidden');
            resetTabStyles();
            btnTabEntregados.className = "px-6 py-2 rounded-lg font-bold transition-all bg-emerald-500 text-white shadow-md border border-transparent flex items-center gap-2";
            await cargarVentasYRenderizar();
        });

        if (btnTabCancelados) btnTabCancelados.addEventListener('click', async () => {
            filtroActual = 'cancelado';
            containerPedidos.classList.remove('hidden');
            containerCatalogo.classList.add('hidden');
            resetTabStyles();
            btnTabCancelados.className = "px-6 py-2 rounded-lg font-bold transition-all bg-red-500 text-white shadow-md border border-transparent flex items-center gap-2";
            await cargarVentasYRenderizar();
        });

        if (btnTabCatalogo) btnTabCatalogo.addEventListener('click', async () => {
            filtroActual = 'catalogo';
            containerPedidos.classList.add('hidden');
            containerCatalogo.classList.remove('hidden');
            resetTabStyles();
            btnTabCatalogo.className = "px-6 py-2 rounded-lg font-bold transition-all bg-primary text-brand-blue shadow-md border border-transparent flex items-center gap-2";
            await cargarYRenderizarCatalogo();
        });

        // --- Renderizado de Datos ---
        async function cargarVentasYRenderizar() {
            try {
                ventasGlobales = await obtenerVentas();
                renderizarTablaPedidos();
                actualizarBadges();
            } catch (err) {
                console.error("Error ventas:", err);
            }
        }

        function renderizarTablaPedidos() {
            const tbody = document.getElementById('tablaPedidosBody');
            if (!tbody) return;
            const filtradas = ventasGlobales.filter(v => v.estado === filtroActual);

            if (filtradas.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500">No hay pedidos ${filtroActual}s.</td></tr>`;
                return;
            }

            tbody.innerHTML = filtradas.map(v => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <div class="text-sm font-bold text-slate-800 dark:text-white uppercase">${v.fecha ? new Date(v.fecha.includes('Z') || v.fecha.includes('+') ? v.fecha : v.fecha.replace(' ', 'T') + 'Z').toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}</div>
                        <div class="text-[10px] text-slate-400 capitalize">${v.fecha ? new Date(v.fecha).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <div class="text-sm font-medium dark:text-slate-200">${v.cliente ? v.cliente.nombres : 'Cliente Anónimo'}</div>
                        <div class="text-[10px] text-slate-500">${v.cliente ? v.cliente.email : ''}</div>
                    </td>
                    <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <div class="text-sm font-bold text-slate-900 dark:text-white">${window.CurrencyManager ? window.CurrencyManager.formatPrice(v.total) : '$' + v.total}</div>
                    </td>
                    <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <span class="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${v.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                    v.estado === 'entregado' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }">${v.estado}</span>
                    </td>
                    <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <div class="flex gap-2">
                            ${v.estado === 'pendiente' ? `
                                <button onclick="window.cambiarEstadoVenta(${v.id_venta}, 'entregado')" class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Marcar como Enviado">
                                    <span class="material-symbols-outlined text-[18px]">local_shipping</span>
                                </button>
                                <button onclick="window.cancelarVentaAdmin(${v.id_venta})" class="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-100 transition-colors" title="Cancelar Pedido (Recuperar Stock)">
                                    <span class="material-symbols-outlined text-[18px]">cancel</span>
                                </button>
                            ` : ''}
                            <button onclick="window.verDetallesPedido(${v.id_venta})" class="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                                <span class="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function actualizarBadges() {
            const countPendientes = ventasGlobales.filter(v => v.estado === 'pendiente').length;
            const badge = document.getElementById('badgePendientes');
            if (badge) {
                badge.textContent = countPendientes;
                badge.classList.toggle('hidden', countPendientes === 0);
            }
        }

        async function cargarYRenderizarCatalogo() {
            const tbody = document.getElementById('tablaCatalogoBody');
            if (!tbody) return;
            try {
                // Obtener todos los productos
                const todos = await obtenerProductos(false);
                // OCULTAR permanentemente los productos soft-deleted (marcados con [ELIMINADO])
                const productos = todos.filter(p => !p.nombre.startsWith('[ELIMINADO]'));

                if (!productos || productos.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500">No hay productos.</td></tr>';
                    return;
                }
                tbody.innerHTML = productos.map(p => `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                            <img src="${p.imagen_url}" class="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700" onerror="this.src='https://placehold.co/100x100?text=No+Img'">
                        </td>
                        <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                            <div class="font-bold text-slate-800 dark:text-white">${p.nombre}</div>
                            <div class="text-[10px] text-slate-400 truncate w-40">${p.descripcion || 'Sin descripción'}</div>
                        </td>
                        <td class="p-4 border-b border-slate-100 dark:border-slate-700/50 text-center">
                            <span class="px-2 py-0.5 rounded text-xs font-bold ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}">${p.stock}</span>
                        </td>
                        <td class="p-4 border-b border-slate-100 dark:border-slate-700/50 font-bold">
                            ${window.CurrencyManager ? window.CurrencyManager.formatPrice(p.precio) : '$' + p.precio}
                        </td>
                        <td class="p-4 border-b border-slate-100 dark:border-slate-700/50 text-center">
                            <div class="flex justify-center gap-2">
                                <button onclick="window.toggleVisibilidadAdmin(${p.id_producto}, ${p.estado})" class="p-2 rounded-lg hover:bg-slate-100 transition-colors ${p.estado ? 'text-blue-500' : 'text-slate-400 opacity-50'}" title="Visibilidad">
                                    <span class="material-symbols-outlined">${p.estado ? 'visibility' : 'visibility_off'}</span>
                                </button>
                                <button onclick="window.eliminarProductoAdmin(${p.id_producto}, '${p.nombre.replace(/'/g, "\\'")}')" class="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Eliminar definitivamente">
                                    <span class="material-symbols-outlined">delete_forever</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            } catch (err) { console.error(err); }
        }

        // --- Funciones Globales ---
        window.cambiarEstadoVenta = async (id, nuevo) => {
            try {
                await actualizarEstadoVenta(id, nuevo);
                mostrarToast(`Venta #${id} -> ${nuevo}`);
                await cargarVentasYRenderizar();
            } catch (err) { mostrarToast(err.message, 'error'); }
        };

        window.toggleVisibilidadAdmin = async (id, estado) => {
            try {
                await actualizarProducto(id, { estado: !estado });
                mostrarToast(`Producto ${!estado ? 'visible' : 'oculto'}`);
                await cargarYRenderizarCatalogo();
            } catch (err) { mostrarToast(err.message, 'error'); }
        };

        window.eliminarProductoAdmin = async (id, nombre) => {
            const confirmed = await window.pixelConfirm(`¿ELIMINAR DEFINITIVAMENTE "${nombre}"?<br><br>Esta acción lo borrará de la base de datos o lo ocultará si ya tiene ventas asociadas.`, {
                titulo: '⚠️ Acción Irreversible',
                btnConfirm: 'Eliminar Producto',
                btnCancel: 'Mantener',
                tipo: 'danger'
            });

            if (confirmed) {
                const btn = document.querySelector(`button[onclick^="window.eliminarProductoAdmin(${id}"]`);
                const originalHTML = btn ? btn.innerHTML : '';
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">sync</span>';
                }

                try {
                    const result = await eliminarProducto(id);
                    if (result === true) {
                        mostrarToast(`Producto "${nombre}" borrado de la base de datos.`);
                    } else {
                        mostrarToast(`Producto "${nombre}" removido del catálogo (OCULTO).`, 'info');
                    }
                    await cargarYRenderizarCatalogo();
                } catch (err) {
                    mostrarToast("Error al eliminar: " + err.message, 'error');
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = originalHTML;
                    }
                }
            }
        };

        window.cancelarVentaAdmin = async (id) => {
            const confirmed = await window.pixelConfirm(`¿Estás seguro de CANCELAR el pedido #${id}?<br><br>Esto devolverá automáticamente los productos al stock del inventario.`, {
                titulo: 'Confirmar Cancelación',
                btnConfirm: 'Confirmar y Devolver Stock',
                tipo: 'danger'
            });

            if (!confirmed) return;

            try {
                mostrarToast(`Procesando devolución de stock para orden #${id}...`, 'info');

                // 1. Obtener detalles para saber qué devolver
                const detalles = await obtenerDetallesVenta(id);

                // 2. Devolver stock a cada producto
                for (const d of detalles) {
                    if (d.id_producto && d.cantidad > 0) {
                        try {
                            const p = await obtenerProductoPorId(d.id_producto);
                            if (p) {
                                const nuevoStock = (p.stock || 0) + d.cantidad;
                                await actualizarProducto(d.id_producto, { stock: nuevoStock });
                                console.log(`Stock recuperado p#${d.id_producto}: +${d.cantidad} (Total: ${nuevoStock})`);
                            }
                        } catch (errP) {
                            console.warn(`No se pudo actualizar stock del producto ${d.id_producto}:`, errP);
                        }
                    }
                }

                // 3. Cambiar estado a cancelado
                await actualizarEstadoVenta(id, 'cancelado');

                mostrarToast(`Pedido #${id} cancelado y stock recuperado.`);
                await cargarVentasYRenderizar();
            } catch (err) {
                mostrarToast("Error al cancelar: " + err.message, 'error');
            }
        };

        window.verDetallesPedido = async (id) => {
            const modal = document.getElementById('modalDetallePedido');
            const itemsContainer = document.getElementById('modalItemsContainer');
            const orderIdText = document.getElementById('modalOrderId');
            const totalText = document.getElementById('modalTotalVenta');
            const btnCerrar = document.getElementById('btnCerrarModal');

            if (!modal || !itemsContainer) return;

            // Reset UI
            orderIdText.textContent = `#${id}`;
            totalText.textContent = '...';
            itemsContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 gap-3 text-slate-500">
                    <span class="spinner" style="border-left-color: #ff9900;"></span>
                    <span>Recuperando recibo...</span>
                </div>
            `;
            modal.showModal();

            if (btnCerrar) btnCerrar.onclick = () => modal.close();

            try {
                const detalles = await obtenerDetallesVenta(id);
                const venta = ventasGlobales.find(v => v.id_venta === id);

                if (!detalles || detalles.length === 0) {
                    itemsContainer.innerHTML = '<p class="text-center p-4">No se encontraron detalles para este pedido.</p>';
                    return;
                }

                itemsContainer.innerHTML = detalles.map(d => {
                    const subtotal = d.subtotal || (d.precio_unitario * d.cantidad);
                    const formattedSubtotal = window.CurrencyManager ? window.CurrencyManager.formatPrice(subtotal) : '$' + subtotal;
                    const imgUrl = d.producto ? d.producto.imagen_url : 'https://placehold.co/100x100?text=No+Img';

                    return `
                        <div class="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                            <img src="${imgUrl}" class="w-16 h-16 object-cover rounded-lg shadow-sm" onerror="this.src='https://placehold.co/100x100?text=No+Img'">
                            <div class="flex-1">
                                <h4 class="font-bold text-slate-800 dark:text-white text-sm">${d.producto ? d.producto.nombre : 'Producto Eliminado'}</h4>
                                <p class="text-xs text-slate-500 dark:text-slate-400">Cantidad: <span class="font-black text-primary">${d.cantidad}</span> x ${window.CurrencyManager ? window.CurrencyManager.formatPrice(d.precio_unitario) : '$' + d.precio_unitario}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-black text-slate-900 dark:text-white">${formattedSubtotal}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                if (venta) {
                    totalText.textContent = window.CurrencyManager ? window.CurrencyManager.formatPrice(venta.total) : '$' + venta.total;
                }

            } catch (err) {
                itemsContainer.innerHTML = `<p class="text-red-500 text-center p-4">Error: ${err.message}</p>`;
            }
        };

        // Carga inicial
        await cargarVentasYRenderizar();
    }
}

function mostrarToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const icon = toast ? toast.querySelector('.material-symbols-outlined') : null;
    if (!toast) {
        console.log("Admin Toast Fallback:", msg);
        return;
    }
    if (toastMsg) toastMsg.textContent = msg;
    toast.className = 'toast show ' + type;
    if (icon) {
        if (type === 'error') icon.textContent = 'error';
        else if (type === 'info') icon.textContent = 'info';
        else icon.textContent = 'check_circle';
    }
    setTimeout(() => toast.classList.remove('show'), 4000);
}
