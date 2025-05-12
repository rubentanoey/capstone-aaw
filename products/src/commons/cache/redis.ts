import { redisClient, initRedis } from "@src/cache";

export interface IRedisService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;
  del(key: string | string[]): Promise<number>;
  delByPrefix(prefix: string): Promise<number>;
}

export class RedisService implements IRedisService {
  private static instance: RedisService;
  private isConnected = false;
  private isInitialized = false;

  private constructor() {
    redisClient.on("error", () => {
      this.isConnected = false;
    });

    redisClient.on("connect", () => {
      this.isConnected = true;
    });

    redisClient.on("ready", () => {
      this.isConnected = true;
    });

    this.isConnected = redisClient.isOpen;
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private async ensureConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      try {
        if (!redisClient.isOpen) {
          await initRedis();
        }
        this.isInitialized = true;
        this.isConnected = redisClient.isOpen;
      } catch (error) {
        console.error("Failed to connect to Redis:", error);
        this.isConnected = false;
      }
    }
    return this.isConnected;
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!(await this.ensureConnection())) return null;
    try {
      const data = await redisClient.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (err) {
      console.error("Redis get error:", err);
      return null;
    }
  }

  public async set<T>(
    key: string,
    value: T,
    ttlSeconds?: number
  ): Promise<boolean> {
    if (!(await this.ensureConnection())) return false;
    try {
      const str = JSON.stringify(value);
      if (ttlSeconds !== undefined) {
        await redisClient.setEx(key, ttlSeconds, str);
      } else {
        await redisClient.set(key, str);
      }
      return true;
    } catch (err) {
      console.error("Redis set error:", err);
      return false;
    }
  }

  public async del(key: string | string[]): Promise<number> {
    if (!(await this.ensureConnection())) return 0;
    try {
      return await redisClient.del(key);
    } catch (err) {
      console.error("Redis del error:", err);
      return 0;
    }
  }

  public async incr(key: string): Promise<number> {
    if (!(await this.ensureConnection())) return 0;
    try {
      return await redisClient.incr(key);
    } catch (err) {
      console.error("Redis incr error:", err);
      return 0;
    }
  }

  public async delByPrefix(prefix: string): Promise<number> {
    if (!(await this.ensureConnection())) return 0;
    try {
      const keys = await redisClient.keys(`${prefix}*`);
      return keys.length > 0 ? await redisClient.del(keys) : 0;
    } catch (err) {
      console.error("Redis delByPrefix error:", err);
      return 0;
    }
  }
}
