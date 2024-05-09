import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';

export const signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validate request body fields
    if (!username || !email || !password) {
      return next(errorHandler(400, 'All fields are required'));
    }

    // Hash the password
    const hashedPassword = bcryptjs.hashSync(password, 10);

    // Create a new user instance
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();

    // Respond with success message
    res.json({ message: 'Signup successful' });
  } catch (error) {
    // Handle errors
    next(error);
  }
};
