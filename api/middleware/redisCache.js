import redisClient from '../config/redis.js';

export const cacheRoute = (duration = 3600) => {
    return async (req, res, next) => {
        if (!redisClient.isReady) return next();

        const key = `cache:${req.originalUrl}`;
        try {
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                console.log("cached");
                return res.status(200).json(JSON.parse(cachedData));
            }

            // Intercept res.json to cache the outgoing response
            const originalJson = res.json;
            res.json = function (data) {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisClient.setEx(key, duration, JSON.stringify(data));
                }
                originalJson.call(this, data);
            };
            next();
        } catch (err) {
            console.error("Redis Cache Error:", err);
            next();
        }
    };
};

export const clearResourceCache = async (pattern) => {
    if (!redisClient.isReady) return;
    try {
        const keys = await redisClient.keys(`cache:${pattern}*`);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (err) {
        console.error("Redis Clear Cache Error:", err);
    }
};
