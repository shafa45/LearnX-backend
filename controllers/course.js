import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import Course from '../models/course';
import slugify from 'slugify';

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
