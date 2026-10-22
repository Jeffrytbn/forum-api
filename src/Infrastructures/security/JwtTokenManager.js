const AuthenticationTokenManager = require('../../Applications/security/AuthenticationTokenManager');
const InvariantError = require('../../Commons/exceptions/InvariantError');

class JwtTokenManager extends AuthenticationTokenManager {
  constructor(jwt) {
    super();
    this._jwt = jwt;
  }

  async createAccessToken(payload) {
    return this._jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, {
      expiresIn: Number(process.env.ACCESS_TOKEN_AGE),
    });
  }

  async createRefreshToken(payload) {
    return this._jwt.sign(payload, process.env.REFRESH_TOKEN_KEY);
  }

  async verifyAccessToken(token) {
    try {
      return this._jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    } catch (error) {
      throw new InvariantError('access token tidak valid');
    }
  }

  async verifyRefreshToken(token) {
    try {
      return this._jwt.verify(token, process.env.REFRESH_TOKEN_KEY);
    } catch (error) {
      throw new InvariantError('refresh token tidak valid');
    }
  }

  async decodePayload(token) {
    return this._jwt.decode(token);
  }
}

module.exports = JwtTokenManager;
