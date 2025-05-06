import CircuitBreaker from "opossum";

export class BreakerOptions {
  timeout: number = 5000;
  errorThresholdPercentage: number = 75;
  resetTimeout: number = 30000;
  rollingCountTimeout: number = 10000;
  rollingCountBuckets: number = 10;

  constructor(options: Partial<BreakerOptions> = {}) {
    Object.assign(this, options);
  }
}

export class ServiceBreaker<T extends (...args: any[]) => Promise<any>> {
  protected breaker: CircuitBreaker;
  protected name: string;
  protected fn: T;

  constructor(fn: T, name: string, options: Partial<BreakerOptions> = {}) {
    this.fn = fn;
    this.name = name;
    const breakerOptions = new BreakerOptions(options);
    this.breaker = new CircuitBreaker(fn, breakerOptions);
    this.setupEventListeners();
  }

  protected setupEventListeners(): void {
    this.breaker.on("open", () => {
      console.log(
        `Circuit breaker [${this.name}] opened - service may be down`
      );
    });

    this.breaker.on("halfOpen", () => {
      console.log(
        `Circuit breaker [${this.name}] half-open - testing if service is back`
      );
    });

    this.breaker.on("close", () => {
      console.log(
        `Circuit breaker [${this.name}] closed - service is operational`
      );
    });

    this.breaker.on("fallback", () => {
      console.log(`Circuit breaker [${this.name}] fallback called`);
    });

    this.breaker.on("timeout", () => {
      console.log(`Circuit breaker [${this.name}] timeout occurred`);
    });
  }

  public async fire(...args: Parameters<T>): Promise<ReturnType<T>> {
    return this.breaker.fire(...args) as ReturnType<T>;
  }

  public fallback(fn: (...args: Parameters<T>) => ReturnType<T>): this {
    this.breaker.fallback(fn);
    return this;
  }
}
