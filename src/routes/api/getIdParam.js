// Gets an authenticated user's fragment data (i.e., raw binary data) with the given id
// e.g. /v1/fragments/:id

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const path = require('path');

// v 0.7 - Added support for markdown to HTML conversion
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
// v 0.10 - Added support for image conversion
const sharp = require('sharp');
// v 0.10.3 - Added support for remaining content type conversions
const yaml = require('js-yaml');
const csv = require('csvtojson');

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

    // tables of currently supported types and conversions
    const extensionToMime = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.avif': 'image/avif',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.md': 'text/markdown',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.yml': 'application/yaml',
      '.yaml': 'application/yaml',
    };

    const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];

    // TO-DO: Add conversion to other types later
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
      // YAML - JSON and vice versa
    } else if (
      (fragment.type === 'application/json' &&
        (idParamExt === '.yaml' ||
          idParamExt === '.yml' ||
          idParamExt === '.json' ||
          idParamExt === '.txt')) ||
      (fragment.type === 'application/yaml' &&
        (idParamExt === '.json' ||
          idParamExt === '.yaml' ||
          idParamExt === '.yml' ||
          idParamExt === '.txt'))
    ) {
      const outMime = extensionToMime[idParamExt];
      logger.info(`Converting fragment ${fragmentId} from ${fragment.type} to ${outMime}`);
      try {
        const asText = data.toString();

        let converted;

        if (fragment.type === 'application/json') {
          const obj = JSON.parse(asText);
          // dump serializes object as YAML document - dump(object[,options])
          converted = idParamExt === '.json' ? JSON.stringify(obj, null, 2) : yaml.dump(obj);
        } else if (fragment.type === 'application/yaml') {
          // load parses strings as single YAML document
          // Returns: plain obj, string, num, null, or undefined.
          // load(string[,options])
          const obj = yaml.load(asText);
          converted =
            idParamExt === '.yaml' || idParamExt === '.yml'
              ? yaml.dump(obj)
              : JSON.stringify(obj, null, 2);
        }
        res.set('Content-Type', outMime);
        return res.status(200).send(converted);
      } catch (err) {
        logger.warn('JSON/YAML conversion failed:', err);
        return res.status(415).json({
          status: 'error',
          error: { message: 'Unsupported JSON/YAML conversion', code: 415 },
        });
      }
      // CSV - using csvtojson v2.0
    } else if (
      fragment.type === 'text/csv' &&
      (idParamExt === '.json' || idParamExt === '.txt' || idParamExt === '.csv')
    ) {
      const outMime = extensionToMime[idParamExt];
      logger.info(`Converting fragment ${fragmentId} from ${fragment.type} to ${outMime}`);

      try {
        const asText = data.toString();
        let converted;
        // using the async/await function 'const jsonArray=await csv().fromFile(csvFilePath)'
        const jsonArray = await csv().fromString(asText);
        if (idParamExt === '.json') {
          converted = JSON.stringify(jsonArray, null, 2);
          res.set('Content-Type', outMime);
        } else if (idParamExt === '.txt') {
          // plain text version (prettified)
          converted = JSON.stringify(jsonArray, null, 2);
          res.set('Content-Type', outMime);
        } else {
          // just return the csv itself (csv to csv)
          res.set('Content-Type', fragment.type);
          converted = data;
        }
        return res.status(200).send(converted);
      } catch (err) {
        logger.warn('CSV/JSON conversion failed:', err);
        return res.status(415).json({
          status: 'error',
          error: { message: 'Unsupported CSV conversion', code: 415 },
        });
      }

      // image conversion support
    } else if (idParamExt && imageTypes.includes(fragment.type)) {
      const outMime = extensionToMime[idParamExt];
      // invalid conversion request
      if (!imageTypes.includes(outMime)) {
        logger.warn(
          `Cannot convert image fragment ${fragmentId} from ${fragment.type} to ${idParamExt}`
        );
        return res.status(415).json({
          status: 'error',
          error: {
            message: `Unsupported image conversion to ${idParamExt}`,
            code: 415,
          },
        });
      }

      logger.info(`Converting image fragment ${fragmentId} from ${fragment.type} to ${outMime}`);

      try {
        let converted;
        switch (idParamExt) {
          case '.png':
            converted = await sharp(data).png().toBuffer();
            break;
          case '.jpg':
          case '.jpeg':
            converted = await sharp(data).jpeg().toBuffer();
            break;
          case '.webp':
            converted = await sharp(data).webp().toBuffer();
            break;
          case '.gif':
            converted = await sharp(data).gif().toBuffer();
            break;
          case '.avif':
            converted = await sharp(data).avif().toBuffer();
            break;
          default:
            throw new Error(`Unhandled extension ${idParamExt}`);
        }

        res.set('Content-Type', outMime);
        return res.status(200).send(converted);
      } catch (err) {
        logger.error('Sharp image conversion failed:', err);
        return res.status(500).json({
          status: 'error',
          error: { message: 'Image conversion failed', code: 500 },
        });
      }
    } else {
      // All other extensions just return as-is
      logger.warn(
        'Failed to hit conversion blocks. Additional conversion implementation is pending'
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
