const ClientError = require('../../../Commons/exceptions/ClientError');
const DomainErrorTranslator = require('../../../Commons/exceptions/DomainErrorTranslator');

// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'fail',
      message: 'body request harus berupa JSON yang valid',
    });
  }

  const translatedError = DomainErrorTranslator.translate(error);

  if (translatedError instanceof ClientError) {
    return res.status(translatedError.statusCode).json({
      status: 'fail',
      message: translatedError.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    status: 'error',
    message: 'terjadi kegagalan pada server kami',
  });
};

module.exports = errorHandler;
