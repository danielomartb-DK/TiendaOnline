/**
 * JS/Rastreo.js - Lógica pública para ver un pedido por ID
 */
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        mostrarError();
        return;
    }

    try {
        await cargarDetalleMision(id);
    } catch (err) {
        console.error(err);
        mostrarError();
    }
});

async function cargarDetalleMision(id) {
    const loader = document.getElementById('trackingLoader');
    const card = document.getElementById('trackingCard');
    const error = document.getElementById('trackingError');

    // 1. Obtener la venta (pública si no pide auth en headers, pero usaremos obtenerVentas filtrado)
    // Nota: Como no tenemos un endpoint público de "Venta Solitaria", usaremos el api.js
    // Necesitamos que api.js no dependa 100% de auth para este caso.

    const response = await fetch(`${SUPABASE_URL}/rest/v1/venta?id_venta=eq.${id}&select=*,cliente(nombres,apellidos)`, {
        method: 'GET',
        headers: headers // Usa el anon_key de api.js
    });

    if (!response.ok) throw new Error("Fallo en red");
    const data = await response.json();

    if (!data || data.length === 0) {
        mostrarError();
        return;
    }

    const venta = data[0];

    // 2. Obtener detalles
    const detalles = await obtenerDetallesVenta(id);

    // 3. Renderizar
    document.getElementById('orderIdText').textContent = id;
    document.getElementById('orderDate').textContent = new Date(venta.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    // Formatear total usando CurrencyManager
    const totalFormateado = window.CurrencyManager ? window.CurrencyManager.formatPrice(venta.total) : `$${venta.total.toLocaleString()}`;
    document.getElementById('totalText').textContent = totalFormateado;

    // Estado
    const statusBadge = document.getElementById('statusBadge');
    if (venta.estado === 'pendiente' || venta.estado === 'PENDIENTE') {
        statusBadge.textContent = 'En espera de Tienda';
        statusBadge.className = 'px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/30';
    } else if (venta.estado === 'entregado' || venta.estado === 'enviado') {
        statusBadge.textContent = 'Misión en Tránsito';
        statusBadge.className = 'px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/30';
    }

    const itemsContainer = document.getElementById('itemsList');
    itemsContainer.innerHTML = detalles.map(d => {
        const prod = d.producto || { nombre: 'Producto Desconocido', imagen_url: '' };
        const subtotalD = window.CurrencyManager ? window.CurrencyManager.formatPrice(d.precio_unitario * d.cantidad) : `$${(d.precio_unitario * d.cantidad).toLocaleString()}`;

        return `
            <div class="flex gap-4 items-center bg-slate-800/40 p-4 rounded-2xl border border-slate-800/50">
                <img src="${prod.imagen_url || 'https://placehold.co/80x80'}" class="w-16 h-16 object-cover rounded-xl border border-slate-700">
                <div class="flex-1">
                    <h4 class="font-bold text-sm text-white">${prod.nombre}</h4>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase">Talla: ${d.talla || 'N/A'}</span>
                        <span class="text-[10px] text-slate-500 font-medium">${d.cantidad} unidad(es)</span>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-black text-primary">${subtotalD}</p>
                </div>
            </div>
        `;
    }).join('');

    loader.classList.add('hidden');
    card.classList.remove('hidden');
}

function mostrarError() {
    document.getElementById('trackingLoader').classList.add('hidden');
    document.getElementById('trackingError').classList.remove('hidden');
}
