const express = require('express');
const asyncHandler = require('../../middlewares/asyncHandler');
const authenticate = require('../../middlewares/authenticate');
const ThreadsHandler = require('./handler');

module.exports = (container) => {
  const router = express.Router();
  const handler = new ThreadsHandler(container);

  router.post('/', authenticate(container), asyncHandler(handler.postThreadHandler));
  router.get('/:threadId', asyncHandler(handler.getThreadByIdHandler));

  return router;
};
