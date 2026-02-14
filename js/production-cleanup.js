/**
 * 🧹 Production Cleanup
 * Script para limpiar elementos de desarrollo en producción
 */

(function() {
    'use strict';
    
    console.log('🧹 Production cleanup initialized');
    
    // Función para limpiar popups y elementos de debug
    function cleanupProduction() {
        // Buscar y eliminar popups de configuración
        const popups = document.querySelectorAll('.fixed.top-4.right-4, .fixed.top-20.right-4, .fixed.top-4.left-4');
        popups.forEach(popup => {
            if (popup.textContent && (
                popup.textContent.includes('Contract Configuration') ||
                popup.textContent.includes('Emergency Wallet Connect') ||
                popup.textContent.includes('StakingLimits') ||
                popup.textContent.includes('Auto-configuration') ||
                popup.textContent.includes('Contract Status') ||
                popup.textContent.includes('Configure')
            )) {
                popup.style.display = 'none';
                popup.remove();
                console.log('🧹 Removed debug popup');
            }
        });
        
        // Buscar elementos con IDs de debug
        const debugElements = document.querySelectorAll('[id*="configurator"], [id*="emergency"], [id*="debug"], [id*="diagnostic"]');
        debugElements.forEach(element => {
            element.style.display = 'none';
            element.remove();
            console.log('🧹 Removed debug element');
        });
        
        // Limpiar elementos con clases de debug
        const debugClasses = document.querySelectorAll('[class*="emergency"], [class*="debug"], [class*="config"]');
        debugClasses.forEach(element => {
            if (element.style.position === 'fixed' || element.style.position === 'absolute') {
                element.style.display = 'none';
                element.remove();
                console.log('🧹 Removed debug class element');
            }
        });
    }
    
    // Ejecutar limpieza inmediatamente
    cleanupProduction();
    
    // Ejecutar después de que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanupProduction);
    }
    
    // Ejecutar limpieza periódicamente para capturar elementos dinámicos
    setInterval(cleanupProduction, 5000);
    
    // Limpiar console logs de debug
    const originalLog = console.log;
    console.log = function(...args) {
        const message = args.join(' ');
        // Filtrar logs de debug
        if (!message.includes('🔧') && 
            !message.includes('🔍') && 
            !message.includes('🚨') && 
            !message.includes('⚠️') && 
            !message.includes('🧪') && 
            !message.includes('🚫') &&
            !message.includes('📦') &&
            !message.includes('🔗')) {
            originalLog.apply(console, args);
        }
    };
    
    console.log('🧹 Production cleanup active');
})();



