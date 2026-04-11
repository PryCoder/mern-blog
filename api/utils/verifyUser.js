import jwt from 'jsonwebtoken';
import {errorHandler} from './error.js';
export const verifyToken = (req, res, next) => {
    const cookieToken = req.cookies?.access_token;
    const authHeader = req.headers?.authorization;
    const bearerToken =
      typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : null;

    const token = cookieToken || bearerToken;
    if (!token) {
        return next(errorHandler(401, 'Unauthorized'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if(err) {
            return next(errorHandler(401, 'Unauthorized'));
        }
        req.user = user;
        next();
    });
};