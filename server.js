import express from 'express';
import cors from 'cors';
const morgan = require('morgan');
require('dotenv').config();
import { readdirSync } from 'fs';
import mongoose from 'mongoose';

// create express app
const app = express();

// DB Config
mongoose
  .connect(process.env.DB_CONNECTION)
  .then(() => console.log('DB Connected'))
  .catch((err) => console.log(err));

// apply middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// route
readdirSync('./routes').map((file) => {
  app.use('/api', require(`./routes/${file}`));
});

// port
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
