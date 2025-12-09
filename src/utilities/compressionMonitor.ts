/**
 * Compression System Monitor
 * 
 * Add to any page to monitor compression performance
 * Usage: Add <CompressionMonitor client:load /> to your page
 */

// Simple inline monitor - no React needed
export function createCompressionMonitor() {
  if (typeof window === 'undefined') return;

  // Create monitor UI
  const monitor = document.createElement('div');
  monitor.id = 'compression-monitor';
  monitor.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: #fff;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    min-width: 250px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: none;
  `;

  const toggle = document.createElement('button');
  toggle.textContent = '📊';
  toggle.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #bf5700;
    color: white;
    border: none;
    font-size: 24px;
    cursor: pointer;
    z-index: 10001;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;

  toggle.addEventListener('click', async () => {
    if (monitor.style.display === 'none') {
      monitor.style.display = 'block';
      toggle.style.display = 'none';
      await updateStats();
    } else {
      monitor.style.display = 'none';
      toggle.style.display = 'block';
    }
  });

  const close = document.createElement('button');
  close.textContent = '✕';
  close.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    font-size: 16px;
  `;
  close.addEventListener('click', () => {
    monitor.style.display = 'none';
    toggle.style.display = 'block';
  });

  monitor.appendChild(close);

  const content = document.createElement('div');
  content.id = 'monitor-content';
  monitor.appendChild(content);

  const actions = document.createElement('div');
  actions.style.cssText = 'margin-top: 10px; display: flex; gap: 5px;';
  
  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = '🔄 Refresh';
  refreshBtn.style.cssText = `
    padding: 5px 10px;
    background: #bf5700;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  `;
  refreshBtn.addEventListener('click', updateStats);

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '🗑️ Clear Cache';
  clearBtn.style.cssText = `
    padding: 5px 10px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  `;
  clearBtn.addEventListener('click', async () => {
    const { clearAssetCache } = await import('./assetOptimization');
    await clearAssetCache();
    await updateStats();
    alert('Cache cleared!');
  });

  actions.appendChild(refreshBtn);
  actions.appendChild(clearBtn);
  monitor.appendChild(actions);

  document.body.appendChild(monitor);
  document.body.appendChild(toggle);

  async function updateStats() {
    try {
      const { getCacheStats } = await import('./assetOptimization');
      const stats = await getCacheStats();

      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
      };

      const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
      };

      content.innerHTML = `
        <div style="margin-bottom: 10px;">
          <strong style="color: #bf5700;">📦 Compression Stats</strong>
        </div>
        <div style="line-height: 1.6;">
          <div>Cached Entries: <strong>${stats.totalEntries}</strong></div>
          <div>Total Size: <strong>${formatBytes(stats.totalSize)}</strong></div>
          <div>Original Size: <strong>${formatBytes(stats.totalOriginalSize)}</strong></div>
          <div>Saved: <strong style="color: #22c55e;">${formatBytes(stats.totalOriginalSize - stats.totalSize)}</strong></div>
          <div>Ratio: <strong style="color: #22c55e;">${stats.compressionRatio.toFixed(1)}%</strong></div>
          ${stats.oldestEntry ? `<div style="margin-top: 5px; font-size: 10px; color: #999;">Oldest: ${formatDate(stats.oldestEntry)}</div>` : ''}
        </div>
      `;
    } catch (error) {
      content.innerHTML = `
        <div style="color: #ef4444;">
          <strong>Error loading stats</strong><br>
          ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
      `;
    }
  }

  // Auto-update every 30 seconds if visible
  setInterval(() => {
    if (monitor.style.display !== 'none') {
      updateStats();
    }
  }, 30000);
}

// Auto-initialize in development
if (import.meta.env.DEV) {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      createCompressionMonitor();
    });
  }
}
