export function createLimit(concurrency: number) {
  let activeCount = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    activeCount--;
    queue.shift()?.();
  };

  return async function limit<T>(task: () => Promise<T>): Promise<T> {
    if (activeCount >= concurrency) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }

    activeCount++;
    try {
      return await task();
    } finally {
      next();
    }
  };
}
