const express = require('express');
const asyncHandler = require('../../middlewares/asyncHandler');
const authenticate = require('../../middlewares/authenticate');
const LikesHandler = require('./handler');

module.exports = (container) => {
  const router = express.Router();
  const handler = new LikesHandler(container);

  router.put('/:threadId/comments/:commentId/likes', authenticate(container), asyncHandler(handler.putLikeHandler));

  return router;
};
