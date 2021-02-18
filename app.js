// Import modules
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true });
const ObjectId = require('mongodb').ObjectId;

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
app.use(bodyParser.json());
app.use((request, response, next) => {
  if (directory[request.path] !== undefined) {
    return response.render(directory[request.path], { parameters: request.query, config, md });
  }

  if (next) return next();
  return response.status(404).end();
});
app.set('view engine', 'pug');
app.set('views', './templates');

app.get('/', async (request, response) => {
  //Get all published flashes
  let flashes = [];
  await crud.findMultipleDocuments('flashes', {/*date: {$lte: (new Date()).toISOString()}*/}).then((result) => {
    if (result !== undefined) flashes = result;
  });

  response.render('homepage', {
    config,
    flashes,
    md,
    cookies: request.cookies,
  });
});

const adminRouter = require('./routers/admin');

app.use('/admin/', adminRouter);

app.post('/subscribe/', async (request, response) => {
  response.cookie('choseSubscribe', true, {maxAge: 1000 * 60 * 60 * 24 * 365});
  return response.status(204).end();
})

app.post('/flashes/:flashId/hit/', async (request, response) => {
  await crud.updateDocumentSpecial('flashes', {_id: ObjectId(request.params.flashId.toString())}, {$inc: {hits: 1}});

  return response.status(204).end();
});

// Listen on port from config.json
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
