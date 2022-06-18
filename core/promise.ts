export enum PromiseStatus {
  PENDING = "pending",
  FULLFILLED = "fulfilled",
  REJECTED = "rejected",
}
export type Noop = () => void;

export type PromiseExecutor<T> = (resolve: (value: T) => void, reject: (reason?: unknown) => void) => void;
export type OnFulfilled<T, R> = (value: T) => R | PromiseAPlus<R>;
export type OnRejected<R> = (reason: any) => R | PromiseAPlus<R>;
export type Resolve<T = any> = (value: T) => void;
export type Reject = (reason: unknown) => void;

function isObject(target: unknown): target is Record<string, unknown> {
  return (typeof target === "object" && target !== null) || typeof target === "function";
}

function isPromise<T = any>(target: unknown): target is PromiseAPlus<T> {
  if (!isObject(target)) {
    return false;
  }

  const then = target["then"];
  if (typeof then === "function") {
    // regarded as Promise
    return true;
  }

  return false;
}

const resolvePromise = <V>(promise2: PromiseAPlus<V>, x: V | PromiseAPlus<V>, resolve: Resolve<V>, reject: Reject) => {
  // error: resolve(promise2)
  if (promise2 === x) {
    return reject(new TypeError("Chaining cycle detected for promise #<PromiseAPlus>"));
  }

  try {
    // getter of x.then maybe throw an Error
    if (isPromise<V>(x)) {
      x.then(
        (y) => {
          // maybe y also is a promise
          resolvePromise(x, y, resolve, reject);
        },
        (r) => {
          reject(r);
        }
      );
    } else {
      resolve(x);
    }
  } catch (e) {
    reject(e);
  }
};

export class PromiseAPlus<T = any> {
  private value: T = undefined;

  private reason: unknown = undefined;

  private status = PromiseStatus.PENDING;

  private onFulfilledCallbacks: Noop[] = [];

  private onRejectedCallbacks: Noop[] = [];

  constructor(executor: PromiseExecutor<T>) {
    const resolve: Resolve<T> = (value) => {
      if (this.status === PromiseStatus.PENDING) {
        this.status = PromiseStatus.FULLFILLED;
        this.value = value;

        // if onFulfilledCallbacks is not empty
        this.onFulfilledCallbacks.forEach((callback) => callback());
      }
    };

    const reject: Reject = (reason) => {
      if (this.status === PromiseStatus.PENDING) {
        this.status = PromiseStatus.REJECTED;
        this.reason = reason;

        // if onRejectedCallbacks is not empty
        this.onRejectedCallbacks.forEach((callback) => callback());
      }
    };

    // for throw error
    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  then<R1 = T, R2 = never>(
    onFullfilled?: (value: T) => R1 | PromiseAPlus<R1>,
    onRejected?: (reason: any) => R2 | PromiseAPlus<R2>
  ): PromiseAPlus<R1 | R2> {
    if (!onFullfilled) {
      onFullfilled = (value) => value as unknown as R1;
    }

    if (!onRejected) {
      onRejected = (reason) => {
        throw reason;
      };
    }

    const promise2 = new PromiseAPlus<R1 | R2>((resolve, reject) => {
      switch (this.status) {
        case PromiseStatus.FULLFILLED: {
          process.nextTick(() => {
            try {
              const x = onFullfilled(this.value);
              resolvePromise<R1>(<PromiseAPlus<R1>>promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });

          break;
        }
        case PromiseStatus.REJECTED: {
          process.nextTick(() => {
            if (!onRejected) {
              return;
            }
            try {
              const x = onRejected(this.reason);
              resolvePromise<R2>(<PromiseAPlus<R2>>promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
          break;
        }
        case PromiseStatus.PENDING: {
          // subscription
          this.onFulfilledCallbacks.push(() => {
            process.nextTick(() => {
              try {
                const x = onFullfilled(this.value);
                resolvePromise<R1>(<PromiseAPlus<R1>>promise2, x, resolve, reject);
              } catch (e) {
                reject(e);
              }
            });
          });
          this.onRejectedCallbacks.push(() => {
            process.nextTick(() => {
              try {
                const x = onRejected(this.reason);
                resolvePromise<R2>(<PromiseAPlus<R2>>promise2, x, resolve, reject);
              } catch (e) {
                reject(e);
              }
            });
          });
          break;
        }
        default:
          break;
      }
    });
    return promise2;
  }

  catch<R>(onRejected: (reason: any) => R | PromiseAPlus<R>) {
    return this.then<never, R>(undefined, onRejected);
  }
}
