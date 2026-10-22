const express = require('express');
const asyncHandler = require('../../middlewares/asyncHandler');
const authenticate = require('../../middlewares/authenticate');
const RepliesHandler = require('./handler');

module.exports = (container) => {
  const router = express.Router();
  const handler = new RepliesHandler(container);

  router.post('/:threadId/comments/:commentId/replies', authenticate(container), asyncHandler(handler.postReplyHandler));
  router.delete('/:threadId/comments/:commentId/replies/:replyId', authenticate(container), asyncHandler(handler.deleteReplyHandler));

  return router;
};
