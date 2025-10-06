const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

module.exports = async (req, res) => {
  try {
    if (Buffer.isBuffer(req.body)) {
      logger.debug('POST request from authenticated user');
      // if user is authenticated and fragment type is supported, lets save it
      logger.debug('Creating Fragment instance');
      const fragment = new Fragment({
        ownerId: req.user, // this needs to be req.user, not req.body.user (req.body is the Buffer!)
        type: req.get('Content-Type'),
        size: req.body.length,
      });
      await fragment.save();
      // store the buffer
      await fragment.setData(req.body);
      logger.debug(`Fragment data: ${fragment}`);
      logger.info('Fragment saved and buffer stored');
      // configure URL depending on if we're running locally or not then set to location header
      const apiUrl = process.env.API_URL || `http://${req.headers.host}`;
      res.set('Location', `${apiUrl}/v1/fragments/${fragment.id}`);
      /** Example of what a response should look like according to the documentation:
       * {
       *   "status": "ok",
       *   "fragment": {
       *     "id": "30a84843-0cd4-4975-95ba-b96112aea189",
       *     "ownerId": "11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a",
       *     "created": "2021-11-02T15:09:50.403Z",
       *     "updated": "2021-11-02T15:09:50.403Z",
       *     "type": "text/plain",
       *     "size": 256
       *   }
       * }
       **/
      res.status(200).json({
        status: 'ok',
        fragment,
      });
      logger.info('POST request successful: new fragment posted');
    } else {
      logger.warn('Invalid unsupported type');
      res.status(400).json({
        status: 'error',
        fragments: [],
        message: 'Invalid unsupported type',
      });
    }
  } catch (err) {
    logger.error(`Unexpected error occurred (you shouldn't be seeing this!): ${err}`);
  }
};
