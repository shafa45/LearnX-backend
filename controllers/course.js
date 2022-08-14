import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import Course from '../models/course';
import slugify from 'slugify';
import { readFileSync } from 'fs';
import User from '../models/user';
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const S3 = new AWS.S3(awsConfig);

export const uploadImage = async (req, res) => {
  //   console.log(req.body);
  try {
    const { image } = req.body;
    if (!image)
      return res.status(400).json({
        message: 'No image found',
      });

    // base64 string to buffer
    const base64Data = new Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

    const type = image.split(';')[0].split('/')[1];

    // image params
    const params = {
      Bucket: 'learnx-bucket',
      Key: `${nanoid()}.${type}`, // file name
      Body: base64Data,
      //   ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: `image/${type}`,
    };

    // upload image to s3
    await S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      console.log(data);
      res.send(data);
    });
  } catch (err) {
    console.log(err);
  }
};

export const removeImage = async (req, res) => {
  try {
    const { image } = req.body;

    // image params
    const params = {
      Bucket: 'learnx-bucket',
      Key: image.Key,
    };

    // send remove request to s3
    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      console.log(data);
      res.status(200).json({
        success: true,
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const create = async (req, res) => {
  // return console.log('Create Course', req.body);

  try {
    const alreadyExists = await Course.findOne({
      slug: slugify(req.body.name.toLowerCase()),
    });

    if (alreadyExists) {
      return res.status(400).json({
        message: 'Title is taken',
      });
    }

    const course = await new Course({
      slug: slugify(req.body.name),
      instructor: req.auth._id,
      ...req.body,
    }).save();

    res.status(201).json({
      course,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send('Course create failed. Try again.');
  }
};

export const read = async (req, res) => {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
    }).populate('instructor', '_id name');

    if (!course) {
      return res.status(404).json({
        message: 'Course not found',
      });
    }
    return res.status(200).send(course);
  } catch (err) {
    console.log(err);
    return res.status(400).send('Course read failed. Try again.');
  }
};

export const uploadVideo = async (req, res) => {
  try {
    // console.log('req.auth._id', req.auth._id);
    // console.log('req.params.instructorId',req.params.instructorId);
    if (req.auth._id != req.params.instructorId) {
      return res.status(401).send('Unauthorized');
    }

    const { video } = req.files;
    // console.log(video);
    if (!video) return res.status(400).send('No video');

    // video params
    const params = {
      Bucket: 'learnx-bucket',
      Key: `${nanoid()}.${video.type.split('/')[1]}`, // file name
      Body: readFileSync(video.path),
      //   ACL: 'public-read',
      ContentType: video.type,
    };

    // upload  to s3
    await S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      // console.log(data);
      res.send(data);
    });
  } catch (err) {
    console.log(err);
  }
};

export const removeVideo = async (req, res) => {
  try {
    if (req.auth._id != req.params.instructorId) {
      return res.status(401).send('Unauthorized');
    }
    const { Bucket, Key } = req.body;
    // console.log(video);

    // if (!video) return res.status(400).send('No video');

    // video params
    const params = {
      Bucket,
      Key,
    };

    // upload  to s3
    await S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      console.log(data);
      res.send({
        success: true,
      });
    });
  } catch (err) {
    console.log(err);
  }
};

export const addLesson = async (req, res) => {
  try {
    const { slug, instructorId } = req.params;
    const { title, content, video } = req.body;

    if (req.auth._id != req.params.instructorId) {
      return res.status(401).send('Unauthorized');
    }

    const updated = await Course.findOneAndUpdate(
      { slug },
      {
        $push: {
          lessons: {
            title,
            content,
            video,
          },
        },
      },
      { new: true }
    ).populate('instructor', '_id name');

    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send('Lesson add failed. Try again.');
  }
};

export const update = async (req, res) => {
  try {
    const { slug } = req.params;
    // console.log(slug);
    const course = await Course.findOne({ slug });
    if (req.auth._id != course.instructor) {
      return res.status(401).send('Unauthorized');
    }

    const updated = await Course.findOneAndUpdate({ slug }, req.body, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const removeLesson = async (req, res) => {
  try {
    const { slug, lessonId } = req.params;
    const course = await Course.findOne({ slug });
    if (req.auth._id != course.instructor) {
      return res.status(401).send('Unauthorized');
    }

    const updated = await Course.findOneAndUpdate(
      { slug },
      {
        $pull: {
          lessons: {
            _id: lessonId,
          },
        },
      },
      { new: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send(err.message);
  }
};

export const updateLesson = async (req, res) => {
  // console.log('lesson update', req.body);
  try {
    const { slug } = req.params;
    const { _id, title, content, video, free_preview } = req.body;
    const course = await Course.findOne({ slug }).select('instructor');

    if (req.auth._id != course.instructor._id) {
      return res.status(401).send('Unauthorized');
    }

    const updated = await Course.updateOne(
      { 'lessons._id': _id },
      {
        $set: {
          'lessons.$.title': title,
          'lessons.$.content': content,
          'lessons.$.video': video,
          'lessons.$.free_preview': free_preview,
        },
      },
      { new: true }
    );

    // console.log('UPDATED => ', updated);
    res.json({ success: true });
  } catch (error) {
    console.log(err);
    return res.status(400).send(error.message);
  }
};

export const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select('instructor');

    if (req.auth._id != course.instructor._id) {
      return res.status(401).send('Unauthorized');
    }

    const updated = await Course.findByIdAndUpdate(
      courseId,
      { published: true },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.log(error);
    return res.status(400).send(error.message);
  }
};

export const unpublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select('instructor');

    if (req.auth._id != course.instructor._id) {
      return res.status(401).send('Unauthorized');
    }

    const updated = await Course.findByIdAndUpdate(
      courseId,
      { published: false },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.log(error);
    return res.status(400).send(error.message);
  }
};

export const courses = async (req, res) => {
  const allPublishedCourses = await Course.find({ published: true }).populate(
    'instructor',
    '_id name'
  );

  res.json(allPublishedCourses);
};

export const checkEnrollment = async (req, res) => {
  const { courseId } = req.params;
  // find courses of the currently logged in user
  const user = await User.findById(req.auth._id);
  // check if course id is found in user courses array
  let ids = [];

  let length = user.courses ? user.courses.length : 0;
  for (let i = 0; i < length; i++) {
    ids.push(user.courses[i]._id.toString());
  }

  res.json({
    status: ids.includes(courseId),
    course: await Course.findById(courseId),
  });
};

export const freeEnrollment = async (req, res) => {
  try {
    // check if course if free or paid
    const course = await Course.findById(req.params.courseId);
    if (course.paid) return;

    const result = await User.findByIdAndUpdate(
      req.auth._id,
      {
        $addToSet: { courses: course._id },
      },
      {
        new: true,
      }
    );

    res.json({
      message: "Congratulations! You've enrolled in this course.",
      course,
    });
  } catch (err) {
    console.log('free enrollment error', err);
    return res.status(400).send(err.message);
  }
};

export const paidEnrollment = async (req, res) => {
  try {
    // check if course is free or paid
    const course = await Course.findById(req.params.courseId).populate(
      'instructor'
    );

    if (!course.paid) return;
    // application fee 30%
    const fee = (course.price * 30) / 100;
    // create stripe session
    const session = await stripe.checkout.session.create({
      payement_method_types: ['card'],
      // purchase details
      line_items: [
        {
          name: course.name,
          amount: Math.round(course.price.toFixed(2) * 100),
          currency: 'usd',
          quantity: 1,
        },
      ],

      // charge buyers and transfer remaining amount to instructors account (after application fee)
      payment_intent_data: {
        application_fee_amount: Math.round(course.price.toFixed(2) * 100),
        transfer_data: {
          destination: course.instructor.stripe_account_id,
        },
      },
      // redirect url after successfull payment
      success_url: `${process.env.STRIPE_SUCCESS_URL}/${course._id}`,
      cancel_url: `${process.env.STRIPE_CANCEL_URL}`,
    });

    console.log(`SESSION ID => ${session.id}`);

    await User.findByIdAndUpdate(req.auth._id, {
      stripeSession: session,
    });

    res.send(session.id);
  } catch (error) {
    console.log('PAID ENROLLMENT ERROR:', error);
    return res.status(400).send('Enrollement failed!');
  }
};
