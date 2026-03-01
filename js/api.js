/**
 * JS/API.js - Capa de Conexión a Datos (Supabase)
 * Maneja todas las peticiones fetch de la aplicación.
 */

const SUPABASE_URL = 'https://tqvjmoczroynlxnoldcm.supabase.co';
// IMPORTANTE: Reemplaza esta llave con tu API Key pública (anon key) real de Supabase.
// La he dejado vacía para que la rellenes o uses una variable de entorno.
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdmptb2N6cm95bmx4bm9sZGNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDM1NTUsImV4cCI6MjA4Nzc3OTU1NX0.Kv8k6fAkP7ZaHdTy4tHsF5ANKPAc2NmY_q0e_iDJulc';

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

/**
 * Obtiene las cabeceras HTTP incluyendo el Token JWT de sesión si existe.
 * Es crucial para que Supabase reconozca al Administrador y le permita saltar el RLS.
 */
function getDynamicHeaders() {
    const defaultHeaders = { ...headers };
    try {
        const sessionStore = localStorage.getItem('PixelWear_session');
        if (sessionStore) {
            const session = JSON.parse(sessionStore);
            if (session.session && session.session.access_token) {
                // Sobrescribir el Authorization Header de la API KEY anónima con el JWT del Usuario Autenticado
                defaultHeaders['Authorization'] = `Bearer ${session.session.access_token}`;
            } else if (session.access_token) {
                defaultHeaders['Authorization'] = `Bearer ${session.access_token}`;
            }
        }
    } catch (e) {
        console.warn('No session found for dynamic headers');
    }
    return defaultHeaders;
}

/**
 * Obtiene todos los productos (activos e inactivos) de la base de datos
 * @returns {Promise<Array>} Lista de productos
 */
async function obtenerProductos() {
    try {
        console.log("Intentando obtener productos de Supabase...");
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto?select=*`, {
            method: 'GET',
            headers: getDynamicHeaders()
        });

        console.log("Status de respuesta de Supabase:", response.status);
        if (!response.ok) {
            const errBody = await response.text();
            console.error('Error cuerpo:', errBody);
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Productos devueltos por la BD:", data.length);
        return data;
    } catch (error) {
        console.error('API Error (obtenerProductos):', error);
        throw error;
    }
}

/**
 * Obtiene un producto específico por su ID
 * @param {number|string} id - ID del producto
 * @returns {Promise<Object>} Datos del producto
 */
async function obtenerProductoPorId(id) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto?id_producto=eq.${id}&select=*`, {
            method: 'GET',
            headers: getDynamicHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('API Error (obtenerProductoPorId):', error);
        throw error;
    }
}

/**
 * Registra un nuevo cliente (o lo obtiene si ya existe por email/documento)
 * @param {Object} datosCliente 
 * @returns {Promise<Object>} Cliente insertado
 */
async function registrarCliente(datosCliente) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/cliente?on_conflict=email`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(datosCliente)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Error al registrar cliente');
        }

        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('API Error (registrarCliente):', error);
        throw error;
    }
}

/**
 * Crea una nueva orden de venta
 * @param {Object} datosVenta 
 * @returns {Promise<Object>} Venta creada
 */
async function registrarVenta(datosVenta) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/venta`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(datosVenta)
        });

        if (!response.ok) throw new Error('Error al registrar la venta');

        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('API Error (registrarVenta):', error);
        throw error;
    }
}

/**
 * Registra múltiples detalles (ítems) asociados a una venta
 * @param {Array} detallesVenta 
 * @returns {Promise<Array>}
 */
async function registrarDetallesVenta(detallesVenta) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/detalle_venta`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(detallesVenta)
        });

        if (!response.ok) throw new Error('Error al registrar el detalle de la venta');

        return await response.json();
    } catch (error) {
        console.error('API Error (registrarDetallesVenta):', error);
        throw error;
    }
}

/**
 * Sube una imagen al bucket de Supabase Storage correspondiente ("productos")
 * @param {File} file - Objeto File del input[type="file"]
 * @returns {Promise<string>} URL pública de la imagen subida
 */
async function subirFotoProducto(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Obtener headers dinámicos y sobrescribir Content-Type para el archivo
        const dynamicHeaders = getDynamicHeaders();
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/productos/${filePath}`, {
            method: 'POST',
            headers: {
                ...dynamicHeaders,
                'Content-Type': file.type
            },
            body: file
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error('[STORAGE] ' + (err.message || 'Error al subir la imagen a Storage'));
        }

        // Retornar la URL pública estandarizada de Supabase
        return `${SUPABASE_URL}/storage/v1/object/public/productos/${filePath}`;
    } catch (error) {
        console.error('API Error (subirFotoProducto):', error);
        throw error;
    }
}

/**
 * Inserta un nuevo producto en la base de datos
 * @param {Object} producto - Objeto con campos obligatorios para tabla producto
 * @returns {Promise<Object>} Promesa que resuelve al producto creado
 */
async function crearProducto(producto) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/producto`, {
            method: 'POST',
            headers: {
                ...getDynamicHeaders(),
                'Prefer': 'return=representation' // Para forzar que devuelva el objeto insertado
            },
            body: JSON.stringify(producto)
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error('Error insertando en la BD:', errBody);
            try {
                const err = JSON.parse(errBody);
                throw new Error('[DATABASE] ' + (err.message || 'Error al crear el producto'));
            } catch (e) {
                throw new Error('[DATABASE] Error al crear el producto en la BD');
            }
        }

        const data = await response.json();
        return data[0];
    } catch (error) {
        console.error('API Error (crearProducto):', error);
        throw error;
    }
}
