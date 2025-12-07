const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const id = req.params.id;

    // same as post, use the rawbody buffer to check isSupportedType
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('PUT called without valid Buffer body');
      return res
        .status(415)
        .json({ status: 'error', error: { code: 415, message: 'Invalid unsupported type' } });
    }
    // locate the existing fragment to confirm its existence
    // extra safety since the UI should not show it if it wasn't there
    let fragment;
    try {
      fragment = await Fragment.byId(ownerId, id);
    } catch {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 404,
          message: `Fragment ${id} not found`,
        },
      });
    }
    const existingType = fragment.type;
    const newType = req.headers['content-type'];

    // enforce fragment content-type matching
    if (newType !== existingType) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 400,
          message: `Content-Type mismatch, expected type to be ${existingType}, got ${newType}.`,
        },
      });
    }

    await fragment.setData(req.body);

    return res.status(200).json({
      status: 'ok',
      fragment: fragment,
    });
  } catch (err) {
    logger.error('Error updating fragment', { err });
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
