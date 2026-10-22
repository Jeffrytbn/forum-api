// Express 4 tidak menangkap rejection dari handler async, jadi diteruskan ke error middleware.
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
