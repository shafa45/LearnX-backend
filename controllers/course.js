import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

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
