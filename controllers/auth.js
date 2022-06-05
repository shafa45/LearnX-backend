import User from '../models/user';
import { hashPassword, comparePassword } from '../utils/auth';
export const register = async (req, res) => {
  try {
    //   console.log(req.body);
    const { name, email, password } = req.body;
    // validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please enter all fields',
      });
    }
    if (password && password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      });
    }
    // check if user already exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }
    // hash password
    const hashedPassword = await hashPassword(password);
    // create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    // send response
    return res.status(201).json({
      message: 'User created successfully',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Server Error',
    });
  }
};
