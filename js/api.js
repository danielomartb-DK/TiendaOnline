/**
 * JS/API.js - Capa de Conexión a Datos (Supabase)
 * Maneja todas las peticiones fetch de la aplicación.
 */

const SUPABASE_URL = 'https://tqvjmoczroynlxnoldcm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdmptb2N6cm95bmx4bm9sZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDM1NTUsImV4cCI6MjA4Nzc3OTU1NX0.Kv8k6fAkP7ZaHdTy4tHsF5ANKPAc2NmY_q0e_iDJulc';

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

function getDynamicHeaders() {
    const defaultHeaders = { ...headers };
    try {
        const sessionStore = localStorage.getItem('PixelWear_session');
        if (sessionStore) {
            const session = JSON.parse(sessionStore);
            if (session.session && session.session.access_token) {
                defaultHeaders['Authorization'] = `Bearer ${session.session.access_token}`;
            } else if (session.access_token) {
                defaultHeaders['Authorization'] = `Bearer ${session.access_token}`;
            }
        }
    } catch (e) { }
    return defaultHeaders;
}

/**
 * Obtiene todos los productos
 */
async function obtenerProductos(soloActivos = false) {
    try {
        let url = `${SUPABASE_URL}/rest/v1/producto?select=*`;
        if (soloActivos) {
            url += '&estado=eq.true';
        }
        const response = await fetch(url, { method: 'GET', headers: headers });
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('API Error (obtenerProductos):', error);
        throw error;
    }
}

/**
 * Obtiene un producto específico por su ID
 */
async function obtenerProductoPorId(id) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id}&select=*`, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('API Error (obtenerProductoPorId):', error);
        throw error;
    }
}

/**
 * Registra un cliente (mejorado para ser robusto sin documento)
 */
async function registrarCliente(datos) {
    try {
        // Buscar por email únicamente si el documento no está presente
        let query = `email=eq.${datos.email}`;
        if (datos.documento) {
            query = `or=(documento.eq.${datos.documento},email.eq.${datos.email})`;
        }

        const getResp = await fetch(`${SUPABASE_URL}/rest/v1/cliente?${query}&select=*`, {
            method: 'GET',
            headers: headers
        });

        if (getResp.ok) {
            const existentes = await getResp.json();
            if (existentes && existentes.length > 0) {
                const old = existentes[0];
                const patchResp = await fetch(`${SUPABASE_URL}/rest/v1/cliente?id_cliente=eq.${old.id_cliente}`, {
                    method: 'PATCH',
                    headers: { ...headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify(datos)
                });
                if (patchResp.ok) {
                    const res = await patchResp.json();
                    return res[0];
                }
                const patchErr = await patchResp.json();
                throw new Error(JSON.stringify(patchErr));
            }
        }

        const response = await fetch(`${SUPABASE_URL}/rest/v1/cliente`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }
        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('API Error (registrarCliente):', error);
        throw error;
    }
}

async function obtenerClientePorEmail(email) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/cliente?email=eq.${email}&select=*`, {
            method: 'GET', headers: headers
        });
        if (!response.ok) throw new Error('Error al buscar cliente');
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function actualizarCliente(id, datos) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/cliente?id_cliente=eq.${id}`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(datos)
        });
        if (!response.ok) throw new Error('Error al actualizar cliente');
        const data = await response.json();
        return data[0];
    } catch (error) {
        throw error;
    }
}

async function actualizarStock(id, dif) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id}&select=stock`, {
            method: 'GET', headers: getDynamicHeaders()
        });
        const [p] = await res.json();
        const next = Math.max(0, parseInt(p.stock) + dif);
        await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id}`, {
            method: 'PATCH',
            headers: { ...getDynamicHeaders() },
            body: JSON.stringify({ stock: next })
        });
    } catch (e) { }
}

async function registrarVenta(venta) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/venta`, {
        method: 'POST', headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify(venta)
    });
    const data = await res.json();
    return data[0];
}

async function registrarDetallesVenta(detalles) {
    await fetch(`${SUPABASE_URL}/rest/v1/detalle_venta`, {
        method: 'POST', headers: headers, body: JSON.stringify(detalles)
    });
}

async function subirFotoProducto(file) {
    const name = `${Date.now()}_${file.name}`;
    await fetch(`${SUPABASE_URL}/storage/v1/object/productos/${name}`, {
        method: 'POST', headers: { ...headers, 'Content-Type': file.type }, body: file
    });
    return `${SUPABASE_URL}/storage/v1/object/public/productos/${name}`;
}

async function crearProducto(p) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/producto`, {
        method: 'POST', headers: { ...getDynamicHeaders(), 'Prefer': 'return=representation' },
        body: JSON.stringify(p)
    });
    const data = await res.json();
    return data[0];
}

async function actualizarProducto(id, datos) {
    await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id}`, {
        method: 'PATCH', headers: { ...getDynamicHeaders() }, body: JSON.stringify(datos)
    });
}

/**
 * Elimina un producto definitivamente
 */
async function eliminarProducto(id) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id}`, {
            method: 'DELETE',
            headers: getDynamicHeaders()
        });
        if (!response.ok) {
            // Si hay FKs, al menos lo inactivamos para que el usuario no lo vea NUNCA más
            // Le cambiamos el nombre para distinguirlo de los "ocultos por visibilidad"
            const resData = await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id}&select=nombre`, { headers: getDynamicHeaders() });
            const pData = await resData.json();
            const nombreAct = pData[0] ? pData[0].nombre : '';
            const nuevoNombre = nombreAct.startsWith('[ELIMINADO]') ? nombreAct : `[ELIMINADO] ${nombreAct}`;

            await actualizarProducto(id, { estado: false, nombre: nuevoNombre });
            return false;
        }
        return true;
    } catch (error) {
        throw error;
    }
}

async function obtenerVentas() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/venta?select=*,cliente(*)&order=fecha.desc`, {
        method: 'GET', headers: getDynamicHeaders()
    });
    return await res.json();
}

async function obtenerMisVentas(idCliente) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/venta?id_cliente=eq.${idCliente}&select=*,cliente(*)&order=fecha.desc`, {
        method: 'GET', headers: getDynamicHeaders()
    });
    return await res.json();
}

async function actualizarEstadoVenta(id, est) {
    await fetch(`${SUPABASE_URL}/rest/v1/venta?id_venta=eq.${id}`, {
        method: 'PATCH', headers: { ...getDynamicHeaders() }, body: JSON.stringify({ estado: est })
    });
}

async function obtenerDetallesVenta(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/detalle_venta?id_venta=eq.${id}&select=*,producto(nombre,imagen_url,stock)`, {
        method: 'GET', headers: getDynamicHeaders()
    });
    return await res.json();
}
