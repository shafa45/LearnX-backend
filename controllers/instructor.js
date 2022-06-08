import User from '../models/user';

import queryString from 'query-string';
const stripe = require('stripe')(process.env.STRIPE_SECRET);

export const makeInstructor = async (req, res) => {
  try {
    // 1. find user from db
    const user = await User.findById(req.auth._id);

    // 2. If user don't have stripe_account_id, create one
    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      console.log('ACCOUNT ID => ', account.id);

      user.stripe_account_id = account.id;
      await user.save();
    }

    // 3. create account link based on account id  (for frontent to complete onboarding process)
    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: `${process.env.STRIPE_REDIRECT_URL}`,
      return_url: `${process.env.STRIPE_REDIRECT_URL}`,

      type: 'account_onboarding',
    });

    // 4. pre-fill any info such as email (optional), then send url response to frontend
    accountLink = Object.assign(accountLink, {
      'stripe_user[email]': user.email,
    });

    // 5. then send the account link as response to frontend
    return res.status(200).json({
      accountLink: `${accountLink.url}?${queryString.stringify(accountLink)}`,
      //   message: 'Instructor created successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: 'Error in making instructor',
    });
  }
};

export const getAccountStatus = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id);
    const account = await stripe.accounts.retrieve(user.stripe_account_id);
    // console.log('Account:', account);
    if (!account.charges_enabled) {
      return res.status(400).json({
        message: 'Account not enabled',
      });
    } else {
      const statusUpdated = await User.findByIdAndUpdate(
        req.auth._id,
        {
          stripe_seller: account,
          $addToSet: { role: 'Instructor' },
        },
        { new: true }
      ).select('-password');

      return res.status(200).json({
        message: 'Account enabled',
        statusUpdated,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

export const currentInstructor = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id).select('-password');

    if (!user.role.includes('Instructor')) {
      return res.sendStatus(403);
    } else {
      return res.status(200).json({
        success: true,
      });
    }
  } catch (err) {
    console.log(err);
  }
};
