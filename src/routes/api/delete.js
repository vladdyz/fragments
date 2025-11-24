// Delete a specific fragment

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const id = req.params.id; // req params is an object with an id key, NOT a string!

    // path.extname()` method returns the extension of a file path as a string, basename returns the filename
    const ext = path.extname(id);
    const fragmentId = path.basename(id, ext);

    logger.debug(`Attempting to delete /v1/fragments/${fragmentId} by ${req.user}`);

    await Fragment.delete(req.user, fragmentId);

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    logger.warn(`Unable to delete fragment: ${err.message}`);

    return res.status(404).json({
      status: 'error',
      error: {
        message: 'Fragment data not found',
        code: 404,
      },
    });
  }
};
