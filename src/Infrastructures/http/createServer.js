const express = require('express');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const errorHandler = require('../../Interfaces/http/middlewares/errorHandler');
const users = require('../../Interfaces/http/api/users');
const authentications = require('../../Interfaces/http/api/authentications');
const threads = require('../../Interfaces/http/api/threads');
const comments = require('../../Interfaces/http/api/comments');
const replies = require('../../Interfaces/http/api/replies');
const likes = require('../../Interfaces/http/api/likes');

const createServer = (container) => {
  const app = express();

  app.use(express.json());

  app.use('/users', users(container));
  app.use('/authentications', authentications(container));
  app.use('/threads', threads(container));
  app.use('/threads', comments(container));
  app.use('/threads', replies(container));
  app.use('/threads', likes(container));

  app.use((req, res, next) => {
    next(new NotFoundError('route tidak ditemukan'));
  });

  app.use(errorHandler);

  return app;
};

module.exports = createServer;
