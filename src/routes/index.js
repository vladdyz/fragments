const express = require('express');

// version and author from package.json
const { version, author } = require('../../package.json');

const { hostname } = require('os');

// Create a router that we can use to mount our API
const router = express.Router();
const logger = require('../logger');

// Our authentication middleware
const { authenticate } = require('../auth');

/**
 * Expose all of our API routes on /v1/* to include an API version.
 * Protect them all with middleware so you have to be authenticated
 * in order to access things.
 */
router.use(`/v1`, authenticate(), require('./api'));

/**
 * Define a simple health check route. If the server is running
 * we'll respond with a 200 OK.  If not, the server isn't healthy.
 */

router.get('/', (req, res) => {
  // Client's shouldn't cache this response (always request it fresh)
  res.setHeader('Cache-Control', 'no-cache');
  // Print the currently used env vars while debugging
  logger.debug(process.env, 'Environment Variables');
  // Send a 200 'OK' response
  res.status(200).json({
    status: 'ok',
    author,
    githubUrl: 'https://github.com/vladdyz/fragments',
    version,
    // Include the hostname in the response
    hostname: hostname(),
  });
});

router.get('/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    HTPASSWD_FILE: process.env.HTPASSWD_FILE,
    AWS_COGNITO_POOL_ID: process.env.AWS_COGNITO_POOL_ID,
  });
});

module.exports = router;
