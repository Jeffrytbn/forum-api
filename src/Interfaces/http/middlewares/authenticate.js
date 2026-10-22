const AuthenticationError = require('../../../Commons/exceptions/AuthenticationError');
const AuthenticationTokenManager = require('../../../Applications/security/AuthenticationTokenManager');

// Autentikasi dilakukan di level interface, bukan di use case,
// sehingga use case tetap dapat dipakai ulang di luar HTTP.
const authenticate = (container) => async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AuthenticationError('Missing authentication');
    }

    const tokenManager = container.getInstance(AuthenticationTokenManager.name);
    const { id, username } = await tokenManager.verifyAccessToken(token);

    req.auth = { credentials: { id, username } };
    next();
  } catch (error) {
    next(new AuthenticationError('Missing authentication'));
  }
};

module.exports = authenticate;
