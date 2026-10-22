const AuthenticationTokenManager = require('../AuthenticationTokenManager');

describe('AuthenticationTokenManager interface', () => {
  it('should throw error when invoke abstract behavior', async () => {
    const tokenManager = new AuthenticationTokenManager();
    const error = 'AUTHENTICATION_TOKEN_MANAGER.METHOD_NOT_IMPLEMENTED';

    await expect(tokenManager.createRefreshToken({})).rejects.toThrowError(error);
    await expect(tokenManager.createAccessToken({})).rejects.toThrowError(error);
    await expect(tokenManager.verifyAccessToken('')).rejects.toThrowError(error);
    await expect(tokenManager.verifyRefreshToken('')).rejects.toThrowError(error);
    await expect(tokenManager.decodePayload('')).rejects.toThrowError(error);
  });
});
