import User from '../models/user';
import { hashPassword, comparePassword } from '../utils/auth';
import jwt from 'jsonwebtoken';

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

export const login = async (req, res) => {
  try {
    // console.log(req.body);
    // check if user exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({
        message: 'User does not exist',
      });
    }
    // check if password is correct
    const isMatch = await comparePassword(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Incorrect password',
      });
    }
    // generate token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    // send user and token to client
    user.password = undefined;

    // send token as cookie
    res.cookie('token', token, {
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      secure: true, // only send cookie over https
    });

    // send response
    res.status(200).json({
      message: 'User logged in successfully',
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'Server Error',
    });
  }
};
