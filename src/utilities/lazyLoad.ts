// Type definitions for requestIdleCallback
interface IdleRequestOptions {
  timeout?: number;
}

type IdleRequestCallback = (deadline: IdleDeadline) => void;

interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
}

/**
 * Carga un script de manera diferida usando IntersectionObserver
 * @param selector - El selector CSS del elemento que al ser visible cargará el script
 * @param callback - La función que se ejecutará cuando el elemento sea visible
 */
export function lazyLoadOnVisible(selector: string, callback: () => void): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const win = window as Window;
  
  if ('IntersectionObserver' in win) {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach((element) => observer.observe(element));
  } else {
    // Fallback para navegadores que no soportan IntersectionObserver
    win.addEventListener('load', () => callback());
  }
}

/**
 * Carga un script cuando el navegador está inactivo
 * @param callback - La función a ejecutar cuando el navegador esté inactivo
 */
export function loadWhenIdle(callback: () => void): void {
  if (typeof window === 'undefined') return;

  const win = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  };

  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(
      () => {
        callback();
      },
      { timeout: 2000 }
    );
  } else {
    // Fallback para navegadores que no soportan requestIdleCallback
    win.addEventListener('load', () => {
      setTimeout(callback, 200);
    });
  }
}
