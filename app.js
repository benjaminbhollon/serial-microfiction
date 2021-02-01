// Import modules
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true });

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
app.use('/admin/', basicAuth({ users: config.admins, challenge: true }));
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

app.get('/admin/', async (request, response) => {
  //Get all unpublished flashes
  let flashes = [];
  await crud.findMultipleDocuments('flashes', {date: {$gt: (new Date()).toISOString()}}).then((result) => {
    if (result !== undefined) flashes = result;
  });

  response.render('admin', {
    config,
    flashes,
    md,
  });
});

app.post('/admin/flash/', async (request, response) => {
  //Get current flashes
  let flashes = [];
  await crud.findMultipleDocuments('flashes', {}).then((result) => {
    if (result !== null) flashes = result;
  });

  //Figure out the next date needing posting
  if (flashes !== undefined) {
    flashes.sort((a, b) => {
      if (a.date < b.date) return -1;
      else if (a.date > b.date) return 1;
      return 0;
    });
  }
  const lastPosted = new Date(flashes.length ? flashes[flashes.length - 1].date : Date.now());
  const daysToAdd = ((config.releasedOn.find(day => day > lastPosted.getUTCDay()) === undefined ? config.releasedOn[0] : config.releasedOn.find(day => day > lastPosted.getUTCDay())) - lastPosted.getUTCDay() + 7) % 7;
  const nextPostDue = new Date(lastPosted.getUTCFullYear(), lastPosted.getUTCMonth(), lastPosted.getUTCDate() + daysToAdd + 1);

  console.log("Right now is:\n", new Date(), "The last post was at:\n", lastPosted, "We need to add n days:\n", daysToAdd, "So the next post should be at:\n", nextPostDue, "The config is:\n", config);
  console.log(lastPosted.getUTCFullYear(), lastPosted.getUTCMonth(), lastPosted.getUTCDate() + daysToAdd + 1, lastPosted.getUTCDate());

  let flash = {
    date: nextPostDue.toISOString().split("T")[0],
    content: request.body.content,
  }

  //await crud.insertDocument('flashes', flash);

  return response.redirect(302, '../');
});

app.get('/subscribe/:frequency/', async (request, response) => {
  response.render("subscribe", {
    frequency: request.params.frequency,
    config,
  });
});

app.post('/subscribe/:frequency/', async (request, response) => {
  if (request.params.frequency === 'none') {
    response.cookie('choseSubscribe', true, {maxAge: 1000 * 60 * 60 * 24 * 365});
    return response.status(204).end();
  }

  let exists = false;
  await crud.findDocument('subscribers', {email: request.body.email.toLowerCase()}).then((result) => {
    if (result) exists = true;
  });
  if (exists) {
    response.cookie('choseSubscribe', true, {maxAge: 1000 * 60 * 60 * 24 * 365});
    return response.render('subscribe', {frequency: request.params.frequency, success: false, err: "Whoopsie! Looks like you're already signed up for email updates!", config});
  }

  const subscriberObject = {
    email: request.body.email.toLowerCase(),
    frequency: request.params.frequency,
  }

  await crud.insertDocument('subscribers', subscriberObject);

  response.cookie('choseSubscribe', true, {maxAge: 1000 * 60 * 60 * 24 * 365});

  return response.render('subscribe', {frequency: request.params.frequency, success: true, config});
})


// Listen on port from config.json
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
