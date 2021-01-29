// Import modules
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const basicAuth = require('express-basic-auth');

// Import config
const config = require('./config.json');
const directory = require('./directory.json');

// Import local modules
const crud = require('./modules/crud');

const app = express();

// Set up middleware
app.use(cookieParser());
app.use(compression());
app.use(express.static('static'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/admin/', basicAuth({ users: config.admins, challenge: true }));
app.use((request, response, next) => {
  if (directory[request.path] !== undefined) {
    return response.render(directory[request.path], { parameters: request.query, config });
  }

  if (next) return next();
  return response.status(404).end();
});
app.set('view engine', 'pug');
app.set('views', './templates');


// Listen on port from config.json
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
