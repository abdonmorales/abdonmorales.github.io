/**
 * Carga un script de manera diferida usando IntersectionObserver
 * @param selector - El selector CSS del elemento que al ser visible cargará el script
 * @param callback - La función que se ejecutará cuando el elemento sea visible
 */
export function lazyLoadOnVisible(selector: string, callback: () => void) {
  if ('IntersectionObserver' in window) {
    const elements = document.querySelectorAll(selector);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback();
          // Desconectar después de la primera vez que se ejecuta
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });
    
    if (elements.length > 0) {
      elements.forEach(element => observer.observe(element));
    }
  } else {
    // Fallback para navegadores que no soportan IntersectionObserver
    window.addEventListener('load', callback);
  }
}

/**
 * Carga un script cuando el navegador está inactivo
 * @param callback - La función a ejecutar cuando el navegador esté inactivo
 */
export function loadWhenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => callback());
  } else {
    window.addEventListener('load', () => {
      setTimeout(callback, 200);
    });
  }
}
