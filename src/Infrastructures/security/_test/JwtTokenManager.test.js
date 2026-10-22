const jwt = require('jsonwebtoken');
const InvariantError = require('../../../Commons/exceptions/InvariantError');
const JwtTokenManager = require('../JwtTokenManager');

describe('JwtTokenManager', () => {
  const payload = { username: 'dicoding', id: 'user-123' };

  describe('createAccessToken function', () => {
    it('should create access token correctly', async () => {
      const spySign = vi.spyOn(jwt, 'sign');
      const jwtTokenManager = new JwtTokenManager(jwt);

      const accessToken = await jwtTokenManager.createAccessToken(payload);

      expect(typeof accessToken).toEqual('string');
      expect(spySign).toBeCalledWith(payload, process.env.ACCESS_TOKEN_KEY, {
        expiresIn: Number(process.env.ACCESS_TOKEN_AGE),
      });
      expect(jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY)).toMatchObject(payload);
    });
  });

  describe('createRefreshToken function', () => {
    it('should create refresh token correctly', async () => {
      const spySign = vi.spyOn(jwt, 'sign');
      const jwtTokenManager = new JwtTokenManager(jwt);

      const refreshToken = await jwtTokenManager.createRefreshToken(payload);

      expect(typeof refreshToken).toEqual('string');
      expect(spySign).toBeCalledWith(payload, process.env.REFRESH_TOKEN_KEY);
      expect(jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY)).toMatchObject(payload);
    });
  });

  describe('verifyAccessToken function', () => {
    it('should throw InvariantError when access token is invalid', async () => {
      const jwtTokenManager = new JwtTokenManager(jwt);
      const refreshToken = await jwtTokenManager.createRefreshToken(payload);

      await expect(jwtTokenManager.verifyAccessToken(refreshToken)).rejects.toThrowError(InvariantError);
    });

    it('should return payload when access token is valid', async () => {
      const jwtTokenManager = new JwtTokenManager(jwt);
      const accessToken = await jwtTokenManager.createAccessToken(payload);

      const result = await jwtTokenManager.verifyAccessToken(accessToken);

      expect(result).toMatchObject(payload);
    });
  });

  describe('verifyRefreshToken function', () => {
    it('should throw InvariantError when refresh token is invalid', async () => {
      const jwtTokenManager = new JwtTokenManager(jwt);
      const accessToken = await jwtTokenManager.createAccessToken(payload);

      await expect(jwtTokenManager.verifyRefreshToken(accessToken)).rejects.toThrowError(InvariantError);
    });

    it('should not throw error when refresh token is valid', async () => {
      const jwtTokenManager = new JwtTokenManager(jwt);
      const refreshToken = await jwtTokenManager.createRefreshToken(payload);

      await expect(jwtTokenManager.verifyRefreshToken(refreshToken)).resolves.not.toThrowError();
    });
  });

  describe('decodePayload function', () => {
    it('should decode payload correctly', async () => {
      const jwtTokenManager = new JwtTokenManager(jwt);
      const accessToken = await jwtTokenManager.createAccessToken(payload);

      const decoded = await jwtTokenManager.decodePayload(accessToken);

      expect(decoded.username).toEqual('dicoding');
      expect(decoded.id).toEqual('user-123');
    });
  });
});
