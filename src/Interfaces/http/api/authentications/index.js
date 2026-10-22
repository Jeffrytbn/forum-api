const express = require('express');
const asyncHandler = require('../../middlewares/asyncHandler');
const AuthenticationsHandler = require('./handler');

module.exports = (container) => {
  const router = express.Router();
  const handler = new AuthenticationsHandler(container);

  router.post('/', asyncHandler(handler.postAuthenticationHandler));
  router.put('/', asyncHandler(handler.putAuthenticationHandler));
  router.delete('/', asyncHandler(handler.deleteAuthenticationHandler));

  return router;
};
