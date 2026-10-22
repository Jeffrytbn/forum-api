const AuthenticationRepository = require('../../../Domains/authentications/AuthenticationRepository');
const LogoutUserUseCase = require('../LogoutUserUseCase');

describe('LogoutUserUseCase', () => {
  it('should throw error when payload does not contain refresh token', async () => {
    const useCase = new LogoutUserUseCase({});

    await expect(useCase.execute({})).rejects.toThrowError('DELETE_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN');
  });

  it('should throw error when refresh token is not a string', async () => {
    const useCase = new LogoutUserUseCase({});

    await expect(useCase.execute({ refreshToken: 123 })).rejects.toThrowError('DELETE_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrate the logout action correctly', async () => {
    const authenticationRepository = new AuthenticationRepository();
    authenticationRepository.checkAvailabilityToken = vi.fn(() => Promise.resolve());
    authenticationRepository.deleteToken = vi.fn(() => Promise.resolve());

    const useCase = new LogoutUserUseCase({ authenticationRepository });

    await useCase.execute({ refreshToken: 'refresh_token' });

    expect(authenticationRepository.checkAvailabilityToken).toBeCalledWith('refresh_token');
    expect(authenticationRepository.deleteToken).toBeCalledWith('refresh_token');
  });
});
