const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

// Returns the metadata for a specific fragment by an authenticated user
// GET /fragments/:id/info
module.exports = async (req, res) => {
  try {
    const id = req.params.id; // req params is an object with an id key, NOT a string!
    logger.debug(`GET /v1/fragments/${id}/info route triggered by: ${req.user}`);

    // Retrieve fragment by its ownerId and id (users shouldn't access metadata from fragments they didn't make)
    const fragment = await Fragment.byId(req.user, id);

    // if the fragment can't be found (it doesn't exist, or belongs to another user) byId will throw an error
    // in which case it gets handled in the catch block and returns a 404

    logger.info(`Returning metadata for fragment ${id}`);
    return res.status(200).json({
      status: 'ok',
      fragment,
    });
  } catch (e) {
    // if something goes wrong, also return a 404 (since we can't find a fragment) but log the error
    logger.warn("Unable to return fragment metadata (most likely it doesn't exist");
    logger.debug('An error occurred during GET src/routes/api/getInfo : ', e);
    res.status(404).json({
      status: 'error',
      error: {
        message: 'Fragment metadata not found',
        code: 404,
      },
    });
  }
};
