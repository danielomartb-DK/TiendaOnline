/**
 * JS/Pedidos.js - Lógica para la sección "Tus Pedidos" del usuario
 */

document.addEventListener('DOMContentLoaded', () => {
    initPedidos();
});

async function initPedidos() {
    let checkInterval = setInterval(async () => {
        if (window.novaAuth && !window.novaAuth._refreshing) {
            clearInterval(checkInterval);
            if (!window.novaAuth.user || !window.novaAuth.user.user) {
                window.location.href = 'login.html';
                return;
            }
            await cargarPedidos();
        }
    }, 50);
}

async function cargarPedidos() {
    const tbody = document.getElementById('listaPedidosUsuario');
    if (!tbody) return;

    try {
        const email = window.novaAuth.user.user.email;
        // 1. Obtener la ID del cliente primero
        const cliente = await obtenerClientePorEmail(email);

        if (!cliente) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500">Aún no has realizado ninguna compra con tu cuenta verificada.</td></tr>`;
            return;
        }

        // 2. Obtener las ventas de este cliente específico
        const misVentas = await obtenerMisVentas(cliente.id_cliente);

        if (!misVentas || misVentas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-12 text-center text-slate-500">
                <span class="material-symbols-outlined text-6xl mb-4 text-slate-300 dark:text-slate-600 block">inventory_2</span>
                <p class="text-lg font-bold text-slate-700 dark:text-slate-300">Aún no tienes pedidos</p>
                <p class="text-sm mt-2"><a href="index.html" class="text-cyan-500 hover:text-cyan-600 underline">Explorar la tienda</a> para empezar.</p>
            </td></tr>`;
            return;
        }

        // 3. Renderizar pedidos
        tbody.innerHTML = misVentas.map(v => {
            const fecha = new Date(v.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            const total = window.CurrencyManager ? window.CurrencyManager.formatPrice(v.total) : '$' + v.total;

            // Colores y badges de estado
            let bgEstado = 'bg-slate-100 text-slate-700';
            let iconEstado = 'schedule';
            let labelEstado = v.estado;

            if (v.estado === 'pendiente') {
                bgEstado = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
                iconEstado = 'pending';
                labelEstado = 'Pendiente';
            } else if (v.estado === 'entregado') {
                bgEstado = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
                iconEstado = 'local_shipping';
                labelEstado = 'Enviado'; // User-friendly term for delivered/shipped
            } else if (v.estado === 'cancelado') {
                bgEstado = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                iconEstado = 'cancel';
                labelEstado = 'Cancelado';
            }

            return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <div class="font-bold text-slate-900 dark:text-white">#${v.id_venta}</div>
                    </td>
                    <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <div class="text-sm text-slate-600 dark:text-slate-300">${fecha}</div>
                    </td>
                    <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <div class="font-bold text-slate-900 dark:text-white">${total}</div>
                    </td>
                    <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${bgEstado}">
                            <span class="material-symbols-outlined text-[16px]">${iconEstado}</span>
                            ${labelEstado}
                        </span>
                    </td>
                    <td class="p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <button onclick="verDetallePropio(${v.id_venta}, '${fecha}', '${labelEstado}')" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                            <span class="material-symbols-outlined text-[18px]">visibility</span> Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error("Error cargando pedidos del usuario:", error);
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Error al cargar el historial de pedidos. Intenta más tarde.</td></tr>`;
    }
}

window.verDetallePropio = async (idVenta, fecha, estadoLabel) => {
    try {
        const modal = document.getElementById('modalDetallePedido');
        const titulo = document.getElementById('modalDetalleTitulo');
        const contenido = document.getElementById('modalDetalleContenido');
        const contenedorTotal = document.getElementById('modalDetalleTotal');

        titulo.innerHTML = `Pedido #${idVenta} <span class="text-sm font-normal text-slate-500 ml-2">${fecha}</span>`;
        contenido.innerHTML = '<div class="flex justify-center p-8"><span class="material-symbols-outlined animate-spin text-4xl text-cyan-500">sync</span></div>';
        contenedorTotal.innerHTML = '';

        modal.showModal();

        const detalles = await obtenerDetallesVenta(idVenta);

        let htmlContext = '<div class="space-y-4">';
        let sumaTotal = 0;

        detalles.forEach(d => {
            const subtotalNum = d.subtotal || (d.precio_unitario * d.cantidad);
            sumaTotal += subtotalNum;
            const subtotalFormateado = window.CurrencyManager ? window.CurrencyManager.formatPrice(subtotalNum) : '$' + subtotalNum;
            const precioUniFormateado = window.CurrencyManager ? window.CurrencyManager.formatPrice(d.precio_unitario) : '$' + d.precio_unitario;

            const nombreProd = d.producto ? d.producto.nombre : 'Producto Eliminado (No disponible)';
            const imgUrl = (d.producto && d.producto.imagen_url) ? d.producto.imagen_url : 'https://placehold.co/100x100?text=No+Img';

            htmlContext += `
                <div class="flex gap-4 items-center bg-slate-50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <img src="${imgUrl}" class="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm" onerror="this.src='https://placehold.co/100x100?text=No+Img'">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-slate-800 dark:text-white truncate">${nombreProd}</h4>
                        <div class="text-sm text-slate-500 mt-1 flex justify-between items-center">
                            <span>${d.cantidad} ud. x ${precioUniFormateado}</span>
                            <span class="font-black text-slate-900 dark:text-white">${subtotalFormateado}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        htmlContext += '</div>';

        contenido.innerHTML = htmlContext;

        const totalFormateado = window.CurrencyManager ? window.CurrencyManager.formatPrice(sumaTotal) : '$' + sumaTotal;
        contenedorTotal.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-sm font-bold text-slate-500 uppercase">Total del Pedido</span>
                <span class="text-2xl font-black text-primary">${totalFormateado}</span>
            </div>
        `;

    } catch (err) {
        console.error("Error cargando detalles:", err);
        document.getElementById('modalDetalleContenido').innerHTML = '<p class="text-red-500">Error al cargar el detalle del pedido. ' + err.message + '</p>';
    }
};

function mostrarToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const icon = toast ? toast.querySelector('.material-symbols-outlined') : null;
    if (!toast) return;
    if (toastMsg) toastMsg.textContent = msg;
    toast.className = 'toast show ' + type;
    if (icon) {
        if (type === 'error') icon.textContent = 'error';
        else if (type === 'info') icon.textContent = 'info';
        else icon.textContent = 'check_circle';
    }
    setTimeout(() => toast.classList.remove('show'), 4000);
}
