// Gets an authenticated user's fragment data (i.e., raw binary data) with the given id
// e.g. /v1/fragments/:id

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const id = req.params.id; // req params is an object with an id key, NOT a string!
    logger.debug(`GET /v1/fragments/${id} (owner: ${req.user})`);

    // in case the param contains a file extension, remove it (see conversion notes below)

    // path.extname()` method returns the extension of a file path as a string, basename returns the filename
    const idParamExt = path.extname(id).toLowerCase();
    const fragmentId = path.basename(id, idParamExt);
    logger.debug(
      `Requested fragment name is ${fragmentId} and extension is ${idParamExt || 'unknown'}`
    );

    const fragment = await Fragment.byId(req.user, fragmentId);

    // if the fragment does not exist, return HTTP code 404 not found
    if (!fragment)
      return res.status(404).json({
        status: 'error',
        message: `Fragment ${id} not found`,
      });

    /**
     * If the id includes an optional extension (e.g., .txt or .png), the server attempts to convert the fragment to the type associated
     * with that extension. Otherwise the successful response returns the raw fragment data using the type specified when created
     * (e.g., text/plain or image/png) as its Content-Type. Right now only plain-text is supported, but this is definitely a TO-DO for later
     *
     * ex: GET v1/fragments/s20acneaj35aD.png -> convert to png, otherwise use fragment.type specified during its creation
     *
     * Table of supported conversions:
     * text/plain	.txt
     * text/markdown	.md, .html, .txt
     * text/html	.html, .txt
     * text/csv	.csv, .txt, .json
     * application/json	.json, .yaml, .yml, .txt
     * application/yaml	.yaml, .txt
     * image/png	.png, .jpg, .webp, .gif, .avif
     * image/jpeg	.png, .jpg, .webp, .gif, .avif
     * image/webp	.png, .jpg, .webp, .gif, .avif
     * image/avif	.png, .jpg, .webp, .gif, .avif
     * image/gif	.png, .jpg, .webp, .gif, .avif
     */

    // Retrieve the fragment's raw data buffer

    const data = await fragment.getData();

    // TO-DO: Add conversion to other types later, just plain text is supported for now
    if (!idParamExt) {
      logger.info('Returning existing fragment data using its default type');
      res.set('Content-Type', fragment.type);
      return res.status(200).send(data);
    } else {
      logger.warn(
        'Only plain text fragments are currently supported, conversion implementation is pending'
      );
      logger.info('Returning existing fragment data using its specified plain-text extension');
      // this will be different later, but for now the returns are the same
      res.set('Content-Type', fragment.type);
      return res.status(200).send(data);
    }
  } catch (e) {
    // if something goes wrong, also return a 404 (since we can't find a fragment) but log the error
    logger.error('Unable to retrieve fragment data by id');
    logger.debug('Unexpected error occurred during GET src/routes/api/getIdParam : ', e);
    return res.status(404).json({
      status: 'error',
      message: 'Fragment not found or access denied',
    });
  }
};
