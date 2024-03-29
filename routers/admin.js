// Require modules
const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const fs = require('fs');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true });
const { ObjectId } = require('mongodb');

// Local modules
const crud = require('../modules/crud');

// Config
const config = require('../config.json');

const router = express.Router();

// Middleware
router.use(express.json());
router.use(bodyParser.json());

// Routes
router.get('/', async (request, response) => {
  // Get all flashes
  let unpublishedFlashes = [];
  let publishedFlashes = [];
  await crud.findMultipleDocuments('flashes', { date: { $gt: (new Date()).toISOString() } }).then((result) => {
    if (result !== undefined) unpublishedFlashes = result;
  });
  await crud.findMultipleDocuments('flashes', { date: { $lte: (new Date()).toISOString() } }).then((result) => {
    if (result !== undefined) publishedFlashes = result;
  });

  response.render('admin', {
    config,
    unpublishedFlashes,
    publishedFlashes,
    md,
    cookies: request.cookies,
  });
});

router.post('/non-flash/', async (request, response) => {
  // Get published flashes
  let flashes = [];
  await crud.findMultipleDocuments('flashes', { date: { $gt: (new Date()).toISOString() } }).then((result) => {
    if (result !== null) flashes = result;
  });

  const flash = {
    date: (request.body.date ? request.body.date : flashes[flashes.length - 1].date),
    content: request.body.content,
    type: request.body.type,
    label: request.body.label,
    hits: 0,
  };

  await crud.insertDocument('flashes', flash);

  response.redirect(302, '/admin/');
});

router.post('/flash/', async (request, response) => {
  // Get current flashes
  let flashes = [];
  await crud.findMultipleDocuments('flashes', {}).then((result) => {
    if (result !== null) flashes = result;
  });

  // Figure out the next date needing posting
  if (flashes !== null) {
    flashes.sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    });
  }
  const lastPosted = new Date(flashes.length ? flashes[flashes.length - 1].date : (new Date()).toISOString().split('T')[0]);
  const daysToAdd = (
    (config
      .releasedOn
      .find((day) => day > lastPosted.getDay()) === undefined
      ? config.releasedOn[0]
      : config.releasedOn.find((day) => day > lastPosted.getDay())) - lastPosted.getDay() + 7
  ) % 7;
  const nextPostDue = new Date(
    lastPosted.getFullYear(),
    lastPosted.getMonth(),
    lastPosted.getDate() + daysToAdd + 1,
  );

  const flash = {
    date: (request.body.date ? request.body.date : nextPostDue.toISOString().split('T')[0]),
    content: request.body.content,
    type: 'flash',
    hits: 0,
  };

  await crud.insertDocument('flashes', flash);

  return response.redirect(302, '/admin/');
});

router.post('/flash/:flashId/update', async (request, response) => {
  await crud.updateDocument('flashes', { _id: ObjectId(request.params.flashId) }, {
    content: request.body.content,
    date: request.body.date,
  });

  response.redirect(302, '/admin/');
});

router.get('/flash/:flashId/delete', async (request, response) => {
  // Note: this is a GET request so it can be directly linked to

  await crud.deleteDocument('flashes', {
    _id: ObjectId(request.params.flashId),
  });

  response.redirect(302, '/admin/');
});

router.get('/cookie/:cookieName/toggle', async (request, response) => {
  if (request.cookies[request.params.cookieName] === 'true') response.cookie(request.params.cookieName, false);
  else response.cookie(request.params.cookieName, true);
  return response.redirect(302, '/admin/');
});

router.post('/config/update', async (request, response) => {
  config.title = request.body.title;
  config.synopsis = request.body.synopsis;
  config.author = {
    name: request.body.authorName,
    about: request.body.authorAbout,
  };
  config.copyright = request.body.copyright;
  config.releasedOn = [];
  for (let i = 0; i < 7; i += 1) {
    if (request.body[`releasedOn-${i}`]) config.releasedOn.push(i);
  }
  config.startYear = parseInt(request.body.startYear, 10);
  config.subscription = {
    all: {
      label: request.body.subscriptionAllLabel,
      link: request.body.subscriptionAllLink,
    },
    weekly: {
      label: request.body.subscriptionWeeklyLabel,
      link: request.body.subscriptionWeeklyLink,
    },
    none: {
      label: request.body.subscriptionNoneLabel,
    },
  };

  await fs.writeFile('./config.json', JSON.stringify(config, null, 2), () => {
    response.redirect(302, '/admin/');
  });
});

// Export
module.exports = router;
