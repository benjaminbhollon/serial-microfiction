// Import modules
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true });
const { ObjectId } = require('mongodb');

const weekDaysShort = ['Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'];
const monthsShort = ['Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'];

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
  // Get all published flashes
  let flashes = [];
  await crud.findMultipleDocuments('flashes', {/* date: {$lte: (new Date()).toISOString()} */}).then((result) => {
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

app.get('/feed/', async (request, response) => {
  let flashes = [];

  await crud.findMultipleDocuments('flashes', { type: 'flash' }).then((result) => {
    flashes = result;
  });

  const feed = flashes.slice(0, 15).map((flash) => {
    const date = new Date(flash.date);
    return `<item>
      <title>Flash for ${flash.date}</title>
      <link>//${request.hostname}/#${flash.date}</link>
      <guid>${flash._id.toString()}</guid>
      <pubDate>${weekDaysShort[date.getDay()]}, ${date.getDate()} ${monthsShort[date.getMonth()]} ${date.getFullYear()} 0:00:00 UTC</pubDate>
      <description>The chunk of the ${config.title} story that was released on ${flash.date}</description>
    </item>`;
  });

  response.type('xml');
  response.send(
    `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>${config.title}</title>
  <description>${config.synopsis}</description>
  <language>en-us</language>
  <copyright>${config.copyright.replace('[[YEARS]]', config.startYear !== new Date().getFullYear() ? `${config.startYear}-${(new Date()).getFullYear()}` : config.startYear).replace('[[AUTHOR]]', config.author.name)}</copyright>
  <link>//${request.hostname}</link>${
  feed.join('')
}
  </channel>
  </rss>`,
  );
});

app.post('/subscribe/', async (request, response) => {
  response.cookie('choseSubscribe', true);
  return response.status(204).end();
});

app.post('/flashes/:flashId/hit/', async (request, response) => {
  if (request.cookies.dontHit !== 'true') await crud.updateDocumentSpecial('flashes', { _id: ObjectId(request.params.flashId.toString()) }, { $inc: { hits: 1 } });

  return response.status(204).end();
});

// Listen on port from config.json
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
