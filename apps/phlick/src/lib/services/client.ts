/** The pretend network: resolve after a beat, like the Chanel client. */
export const resolve = <T,>(data: T, delay = 220): Promise<T> =>
  new Promise((r) => setTimeout(() => r(data), delay));
