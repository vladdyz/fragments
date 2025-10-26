const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  // Function must be asynchronous since we're awaiting a promise
  try {
    // the user may pass in a query string for an optional expand parameter (GET /fragments/?expand=1)
    // in this case we want a full representation of the fragments' metadata (i.e., not just id)
    const expanded = req.query.expand === '1' || req.query.expand === true;
    const fragments = await Fragment.byUser(req.user, expanded);
    logger.info('Retrieving fragments for authenticated user');
    logger.debug('Fragments found: ', fragments);
    // instead of always returning an empty array, return any fragments with matching ownerIds (hashed emails)
    res.status(200).json({
      status: 'ok',
      fragments,
    });
  } catch (e) {
    // if something unexpected occurs, just return the hard-coded empty array as default behaviour but also log the error
    logger.error("Unable to retrieve user's fragments");
    logger.debug('Unexpected error occurred during GET request in src/routes/api : ', e);
    res.status(200).json({
      status: 'ok',
      fragments: [],
    });
  }
};
