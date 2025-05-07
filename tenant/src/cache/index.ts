import "dotenv/config";
import { createClient } from "redis";

const REDIS_HOST = process.env.REDIS_HOST ?? "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB ?? "0", 10);

if (!REDIS_PASSWORD) {
  console.error("Redis password is required but not provided");
  process.exit(1); 
}

const constructedRedisUrl = `redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`;

const connectionUrl = process.env.REDIS_URL || constructedRedisUrl;

if (process.env.REDIS_URL && process.env.REDIS_URL !== constructedRedisUrl) {
  console.warn("REDIS_URL differs from constructed URL. Using REDIS_URL.");
  console.warn(`- REDIS_URL: ${process.env.REDIS_URL}`);
  console.warn(`- Constructed: ${constructedRedisUrl}`);
}

export const redisClient = createClient({
  url: connectionUrl,
});

redisClient.connect().catch((error) => {
  console.error("Failed to connect to Redis:", error);
  process.exit(1);
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("Redis Client Connected");
});

redisClient.on("reconnecting", () => {
  console.log("Redis Client Reconnecting");
});

redisClient.on("ready", () => {
  console.log("Redis Client Ready");
});
