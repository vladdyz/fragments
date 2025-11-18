// Gets an authenticated user's fragment data (i.e., raw binary data) with the given id
// e.g. /v1/fragments/:id

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const path = require('path');

// v 0.7 - Added support for markdown to HTML conversion
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

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
    // byId will throw an error, so this is handled in the catch block

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
      // Markdown -> HTML support
    } else if (idParamExt === '.html' && fragment.type === 'text/markdown') {
      // Using a markdown parser, render the data as an HTML string instead
      logger.info(`Converting a Markdown fragment ${fragmentId} to HTML`);
      const html = md.render(data.toString());
      res.set('Content-Type', 'text/html');
      return res.status(200).send(html);
    } else {
      // All other extensions just return as-is
      logger.warn(
        'Only markdown to HTML is supported, additional conversion implementation is pending'
      );
      logger.info('Returning existing fragment data using its specified plain-text extension');
      // this will be different later, but for now the returns are the same
      res.set('Content-Type', fragment.type);
      return res.status(200).send(data);
    }
  } catch (e) {
    // if something goes wrong, also return a 404 (since we can't find a fragment) but log the error
    // this will be hit if fragment.byId can't resolve the promise as it will throw an error
    logger.warn("Unable to retrieve fragment data by id, most likely it doesn't exist");
    logger.debug('An error occurred during GET src/routes/api/getIdParam : ', e);
    return res.status(404).json({
      status: 'error',
      error: {
        message: 'Fragment not found',
        code: 404,
      },
    });
  }
};
