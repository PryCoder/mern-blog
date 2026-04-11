import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

export const connectRedis = async () => {
  try {
    if (!redisClient.isReady) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error('Failed to connect to Redis', err);
  }
};

export default redisClient;
