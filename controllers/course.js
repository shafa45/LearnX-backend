import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import Course from '../models/course';
import slugify from 'slugify';
import { readFileSync } from 'fs';

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
