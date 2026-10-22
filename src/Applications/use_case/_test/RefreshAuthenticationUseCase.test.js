const AuthenticationRepository = require('../../../Domains/authentications/AuthenticationRepository');
const AuthenticationTokenManager = require('../../security/AuthenticationTokenManager');
const RefreshAuthenticationUseCase = require('../RefreshAuthenticationUseCase');

describe('RefreshAuthenticationUseCase', () => {
  it('should throw error when payload does not contain refresh token', async () => {
    const useCase = new RefreshAuthenticationUseCase({});

    await expect(useCase.execute({})).rejects.toThrowError('REFRESH_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN');
  });

  it('should throw error when refresh token is not a string', async () => {
    const useCase = new RefreshAuthenticationUseCase({});

    await expect(useCase.execute({ refreshToken: 1 })).rejects.toThrowError('REFRESH_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrate the refresh authentication action correctly', async () => {
    const authenticationRepository = new AuthenticationRepository();
    const authenticationTokenManager = new AuthenticationTokenManager();
    authenticationTokenManager.verifyRefreshToken = vi.fn(() => Promise.resolve());
    authenticationRepository.checkAvailabilityToken = vi.fn(() => Promise.resolve());
    authenticationTokenManager.decodePayload = vi.fn(() => Promise.resolve({ username: 'dicoding', id: 'user-123' }));
    authenticationTokenManager.createAccessToken = vi.fn(() => Promise.resolve('new_access_token'));

    const useCase = new RefreshAuthenticationUseCase({ authenticationRepository, authenticationTokenManager });

    const accessToken = await useCase.execute({ refreshToken: 'some_refresh_token' });

    expect(accessToken).toEqual('new_access_token');
    expect(authenticationTokenManager.verifyRefreshToken).toBeCalledWith('some_refresh_token');
    expect(authenticationRepository.checkAvailabilityToken).toBeCalledWith('some_refresh_token');
    expect(authenticationTokenManager.decodePayload).toBeCalledWith('some_refresh_token');
    expect(authenticationTokenManager.createAccessToken).toBeCalledWith({ username: 'dicoding', id: 'user-123' });
  });
});
