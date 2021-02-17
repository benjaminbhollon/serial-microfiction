// Require modules
const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true });

//Local modules
const crud = require('../modules/crud');

// Config
const config = require('../config.json');

const router = express.Router();

//Middleware
router.use(basicAuth({ users: config.admins, challenge: true }));
router.use(express.json());
router.use(bodyParser.json());

//Routes
router.get('/admin/', async (request, response) => {
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

router.post('/admin/flash/', async (request, response) => {
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
  const daysToAdd = ((config.releasedOn.find(day => day > lastPosted.getDay()) === undefined ? config.releasedOn[0] : config.releasedOn.find(day => day > lastPosted.getDay())) - lastPosted.getDay() + 7) % 7;
  const nextPostDue = new Date(lastPosted.getFullYear(), lastPosted.getMonth(), lastPosted.getDate() + daysToAdd + 1);

  let flash = {
    date: nextPostDue.toISOString().split("T")[0],
    content: request.body.content,
  }

  await crud.insertDocument('flashes', flash);

  return response.redirect(302, '../');
});

//Routes
module.exports = router;
