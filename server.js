import express from 'express';
import cors from 'cors';
const morgan = require('morgan');
require('dotenv').config();
import { readdirSync } from 'fs';

// create express app
const app = express();

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
