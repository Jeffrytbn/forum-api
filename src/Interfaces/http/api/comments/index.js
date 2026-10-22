const express = require('express');
const asyncHandler = require('../../middlewares/asyncHandler');
const authenticate = require('../../middlewares/authenticate');
const CommentsHandler = require('./handler');

module.exports = (container) => {
  const router = express.Router();
  const handler = new CommentsHandler(container);

  router.post('/:threadId/comments', authenticate(container), asyncHandler(handler.postCommentHandler));
  router.delete('/:threadId/comments/:commentId', authenticate(container), asyncHandler(handler.deleteCommentHandler));

  return router;
};
