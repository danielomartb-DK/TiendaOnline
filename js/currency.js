/**
 * JS/Currency.js - Lógica global de cambio de divisas de PixelWear
 */

const CurrencyManager = {
    // Tasas de conversión fijas respecto al USD base
    rates: {
        'USD': 1,
        'COP': 4150,  // 1 USD ≈ 4150 Pesos Colombianos
        'MXN': 17.50, // 1 USD ≈ 17.50 MXN
        'EUR': 0.92   // 1 USD ≈ 0.92 Euros
    },

    // Obtiene la moneda actual del localStorage o por defecto USD
    getCurrentCurrency: function () {
        return localStorage.getItem('pixelwear_currency') || 'COP';
    },

    // Establece la moneda actual (guardando en local storage) y recarga
    setCurrency: function (currencyCode) {
        if (this.rates[currencyCode]) {
            localStorage.setItem('pixelwear_currency', currencyCode);
            // Al cambiar la moneda, forzamos la recarga de la página para que 
            // los scripts locales (app.js, producto.js) vuelvan a pintar los precios.
            window.location.reload();
        }
    },

    // Formatea el precio base de la BD a la moneda activa
    formatPrice: function (basePriceUSD) {
        const currency = this.getCurrentCurrency();
        const convertedPrice = this.fromBase(basePriceUSD);

        // Formato interno de JavaScript para inyectar correctamente la puntuación locale
        const formatter = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: currency === 'COP' ? 0 : 2,
            maximumFractionDigits: currency === 'COP' ? 0 : 2
        });

        return formatter.format(convertedPrice);
    },

    // Convierte precio base (USD) a precio local (ej: COP) sin formato
    fromBase: function (basePriceUSD) {
        const currency = this.getCurrentCurrency();
        const rate = this.rates[currency] || 1;
        return basePriceUSD * rate;
    },

    // Convierte precio local (ej: COP) a precio base (USD) para guardar en DB
    toBase: function (localPrice) {
        const currency = this.getCurrentCurrency();
        const rate = this.rates[currency] || 1;
        return localPrice / rate;
    },

    // Devuelve el símbolo de la moneda actual
    getCurrencySymbol: function () {
        const currency = this.getCurrentCurrency();
        switch (currency) {
            case 'COP': return '$ COP';
            case 'EUR': return '€';
            case 'MXN': return '$ MXN';
            default: return '$';
        }
    },

    // Inicializa el selector de moneda en el header del HTML
    initSelector: function () {
        const selects = document.querySelectorAll('.currency-selector');
        const currentCurrency = this.getCurrentCurrency();

        selects.forEach(select => {
            select.value = currentCurrency;
            select.addEventListener('change', (e) => {
                this.setCurrency(e.target.value);
            });
        });
    }
};

// Arrancar listener de selector de moneda
document.addEventListener('DOMContentLoaded', () => {
    CurrencyManager.initSelector();
});

// Exponer de forma global para usarlo en app.js y otros scripts
window.CurrencyManager = CurrencyManager;
