/**
 * Compression Worker Pool
 * 
 * Manages multiple Web Workers for concurrent compression tasks
 * Provides automatic load balancing and task queuing
 */

interface WorkerTask {
  id: string;
  type: 'compress' | 'decompress' | 'compress-image';
  data: any;
  options?: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
}

class CompressionWorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private pendingTasks: Map<string, WorkerTask> = new Map();
  private workerCount: number;
  private taskIdCounter = 0;

  constructor(workerCount?: number) {
    // Use CPU core count - 1, minimum 2, maximum 4
    this.workerCount = workerCount || Math.min(Math.max(navigator.hardwareConcurrency - 1, 2), 4);
    this.initialize();
  }

  private initialize(): void {
    for (let i = 0; i < this.workerCount; i++) {
      try {
        const worker = new Worker('/compression-worker.js');
        worker.addEventListener('message', (e) => this.handleWorkerMessage(worker, e));
        worker.addEventListener('error', (e) => this.handleWorkerError(worker, e));
        this.workers.push(worker);
        this.availableWorkers.push(worker);
      } catch (error) {
        console.error('Failed to create worker:', error);
      }
    }

    if (this.workers.length === 0) {
      console.warn('No workers available - compression will be disabled');
    }
  }

  private handleWorkerMessage(worker: Worker, event: MessageEvent): void {
    const { type, id, result, error } = event.data;

    const task = this.pendingTasks.get(id);
    if (!task) return;

    this.pendingTasks.delete(id);
    this.availableWorkers.push(worker);

    if (error) {
      task.reject(new Error(error));
    } else {
      task.resolve(result);
    }

    // Process next task in queue
    this.processQueue();
  }

  private handleWorkerError(worker: Worker, event: ErrorEvent): void {
    console.error('Worker error:', event.message);
    
    // Find and reject all pending tasks for this worker
    this.pendingTasks.forEach((task, id) => {
      task.reject(new Error('Worker error: ' + event.message));
      this.pendingTasks.delete(id);
    });

    // Return worker to pool
    if (!this.availableWorkers.includes(worker)) {
      this.availableWorkers.push(worker);
    }
  }

  private processQueue(): void {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift()!;
      const worker = this.availableWorkers.shift()!;
      
      this.pendingTasks.set(task.id, task);
      worker.postMessage({
        type: task.type,
        id: task.id,
        data: task.data,
        options: task.options
      });
    }
  }

  private enqueueTask(task: WorkerTask): void {
    if (this.availableWorkers.length > 0) {
      const worker = this.availableWorkers.shift()!;
      this.pendingTasks.set(task.id, task);
      worker.postMessage({
        type: task.type,
        id: task.id,
        data: task.data,
        options: task.options
      });
    } else {
      this.taskQueue.push(task);
    }
  }

  /**
   * Compress data in a worker thread
   */
  async compress(data: string | Uint8Array | ArrayBuffer, options?: any): Promise<any> {
    if (this.workers.length === 0) {
      throw new Error('No workers available');
    }

    return new Promise((resolve, reject) => {
      const id = `task-${this.taskIdCounter++}`;
      
      // Convert to transferable format
      let transferData: ArrayBuffer | string;
      if (data instanceof Uint8Array) {
        transferData = data.buffer;
      } else if (data instanceof ArrayBuffer) {
        transferData = data;
      } else {
        transferData = data;
      }

      this.enqueueTask({
        id,
        type: 'compress',
        data: transferData,
        options,
        resolve,
        reject
      });
    });
  }

  /**
   * Decompress data in a worker thread
   */
  async decompress(compressed: any): Promise<Uint8Array> {
    if (this.workers.length === 0) {
      throw new Error('No workers available');
    }

    return new Promise((resolve, reject) => {
      const id = `task-${this.taskIdCounter++}`;
      
      this.enqueueTask({
        id,
        type: 'decompress',
        data: compressed,
        resolve: (result) => resolve(new Uint8Array(result)),
        reject
      });
    });
  }

  /**
   * Compress image in a worker thread
   */
  async compressImage(imageData: ImageData, options?: any): Promise<any> {
    if (this.workers.length === 0) {
      throw new Error('No workers available');
    }

    return new Promise((resolve, reject) => {
      const id = `task-${this.taskIdCounter++}`;
      
      const transferData = {
        data: imageData.data.buffer,
        width: imageData.width,
        height: imageData.height
      };

      this.enqueueTask({
        id,
        type: 'compress-image',
        data: transferData,
        options,
        resolve,
        reject
      });
    });
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalWorkers: number;
    availableWorkers: number;
    pendingTasks: number;
    queuedTasks: number;
  } {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      pendingTasks: this.pendingTasks.size,
      queuedTasks: this.taskQueue.length
    };
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.pendingTasks.clear();
  }
}

// Global worker pool instance
let globalWorkerPool: CompressionWorkerPool | null = null;

/**
 * Get or create the global worker pool
 */
export function getWorkerPool(): CompressionWorkerPool {
  if (!globalWorkerPool) {
    globalWorkerPool = new CompressionWorkerPool();
  }
  return globalWorkerPool;
}

/**
 * Compress data using worker pool
 */
export async function compressAsync(data: string | Uint8Array | ArrayBuffer): Promise<any> {
  const pool = getWorkerPool();
  return await pool.compress(data);
}

/**
 * Decompress data using worker pool
 */
export async function decompressAsync(compressed: any): Promise<Uint8Array> {
  const pool = getWorkerPool();
  return await pool.decompress(compressed);
}

/**
 * Compress image using worker pool
 */
export async function compressImageAsync(imageData: ImageData): Promise<any> {
  const pool = getWorkerPool();
  return await pool.compressImage(imageData);
}

/**
 * Batch compress multiple items concurrently
 */
export async function compressBatch(items: (string | Uint8Array | ArrayBuffer)[]): Promise<any[]> {
  const pool = getWorkerPool();
  return await Promise.all(items.map(item => pool.compress(item)));
}

/**
 * Get worker pool statistics
 */
export function getPoolStats() {
  return globalWorkerPool?.getStats() || {
    totalWorkers: 0,
    availableWorkers: 0,
    pendingTasks: 0,
    queuedTasks: 0
  };
}

/**
 * Terminate worker pool (cleanup)
 */
export function terminateWorkerPool(): void {
  if (globalWorkerPool) {
    globalWorkerPool.terminate();
    globalWorkerPool = null;
  }
}
