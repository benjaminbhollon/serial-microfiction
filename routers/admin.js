// Require modules
const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true });
const ObjectId = require('mongodb').ObjectId;

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
router.get('/', async (request, response) => {
  //Get all unpublished flashes
  let unpublishedFlashes = [];
  let publishedFlashes = [];
  await crud.findMultipleDocuments('flashes', {date: {$gt: (new Date()).toISOString()}}).then((result) => {
    if (result !== undefined) unpublishedFlashes = result;
  });
  await crud.findMultipleDocuments('flashes', {date: {$lte: (new Date()).toISOString()}}).then((result) => {
    if (result !== undefined) publishedFlashes = result;
  });

  response.render('admin', {
    config,
    unpublishedFlashes,
    publishedFlashes,
    md,
  });
});

router.post('/flash/', async (request, response) => {
  //Get current flashes
  let flashes = [];
  await crud.findMultipleDocuments('flashes', {}).then((result) => {
    if (result !== null) flashes = result;
  });

  //Figure out the next date needing posting
  if (flashes !== null) {
    flashes.sort((a, b) => {
      if (a.date < b.date) return -1;
      else if (a.date > b.date) return 1;
      return 0;
    });
  }
  const lastPosted = new Date(flashes.length ? flashes[flashes.length - 1].date : Date.now());
  const daysToAdd = ((config.releasedOn.find(day => day > lastPosted.getDay()) === undefined ? config.releasedOn[0] : config.releasedOn.find(day => day > lastPosted.getDay())) - lastPosted.getDay() + 7) % 7;
  let nextPostDue = new Date(lastPosted.getFullYear(), lastPosted.getMonth(), lastPosted.getDate() + daysToAdd + 1);

  let flash = {
    date: (request.body.date ? request.body.date :  nextPostDue.toISOString().split("T")[0]),
    content: request.body.content,
    hits: 0,
  }

  await crud.insertDocument('flashes', flash);

  return response.redirect(302, '../');
});

router.get('/flash/:flashId/delete/', async (request, response) => {
  //Note: this is a GET request so it can be directly linked to

  await crud.deleteDocument('flashes', {
    _id: ObjectId(request.params.flashId)
  });

  response.redirect(302, '/admin/');
})

//Routes
module.exports = router;
