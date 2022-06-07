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
