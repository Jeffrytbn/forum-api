const express = require('express');
const asyncHandler = require('../../middlewares/asyncHandler');
const UsersHandler = require('./handler');

module.exports = (container) => {
  const router = express.Router();
  const handler = new UsersHandler(container);

  router.post('/', asyncHandler(handler.postUserHandler));

  return router;
};
