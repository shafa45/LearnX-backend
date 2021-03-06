import User from '../models/user';
import { hashPassword, comparePassword } from '../utils/auth';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const SES = new AWS.SES(awsConfig);

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

export const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return res.status(200).json({
      message: 'User logged out successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Server Error',
    });
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id).select('-password');
    // console.log('CURRENT_USER', user);
    return res.json({
      success: true,
    });
  } catch (err) {
    // console.log(err.message);
  }
};

export const sendEmail = async (req, res) => {
  const params = {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: ['safaullah16@gmail.com', 'safaullah14@gmail.com'],
    },
    ReplyToAddresses: [process.env.EMAIL_FROM],
    Message: {
      Subject: {
        Data: 'Reset Password',
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: `<html>
            <body>
            <h1>Password Reset Link</h1>
            <p>Please use the following link to reset your password</p>
            </body>
            </html>`,
          Charset: 'UTF-8',
        },
      },
    },
  };
  const emailSent = SES.sendEmail(params).promise();
  emailSent
    .then((data) => {
      console.log(data);
      res.status(200).json({
        message: 'Email sent successfully',
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({
        message: 'Error sending email',
      });
    });
}; // sendEmail

export const forgotPassword = async (req, res) => {
  try {
    // console.log(req.body.email);
    const shortCode = nanoid(6);
    const user = await User.findOneAndUpdate(
      { email: req.body.email },
      {
        $set: {
          passwordResetToken: shortCode,
          passwordResetExpires: Date.now() + 3600000, // 1 hour
        },
      },
      { new: true }
    );
    if (!user) {
      return res.status(400).json({
        message: 'User does not exist',
        success: false,
      });
    }

    // email options
    const params = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [req.body.email],
      },
      ReplyToAddresses: [process.env.EMAIL_FROM],
      Message: {
        Subject: {
          Data: 'Reset Password',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `<html>
            <body>
            <h1>Password Reset Code</h1>
            <p>Please use the following code to reset your password</p>
            <h2 style='color:red;'>${shortCode}</h2>
            <p>This code will expire in 1 hour</p>
            <footer> <i style='color: teal; font-size: 20px; font-weight: bold;'> LearnX  </i>${new Date().getFullYear()} | All rights reserved &copy;  </footer>
            </body>
            </html>`,
            Charset: 'UTF-8',
          },
        },
      },
    };

    // send email
    const emailSent = SES.sendEmail(params).promise();
    emailSent
      .then((data) => {
        console.log(data);
        res.status(200).json({
          message: 'Email sent successfully',
          success: true,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(400).json({
          message: 'Error sending email',
          success: false,
        });
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Server Error',
      success: false,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const hashedPassword = await hashPassword(req.body.newPassword);
    const user = await User.findOneAndUpdate(
      {
        email: req.body.email,
        passwordResetToken: req.body.code,
        passwordResetExpires: { $gt: Date.now() },
      },
      {
        $set: {
          password: hashedPassword,
          passwordResetToken: '',
          passwordResetExpires: '',
        },
      },
      { new: true }
    );
    if (!user) {
      return res.status(400).json({
        message: 'Invalid token',
        success: false,
      });
    }
    return res.status(200).json({
      message: 'Password reset successfully',
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Server Error',
      success: false,
    });
  }
};
