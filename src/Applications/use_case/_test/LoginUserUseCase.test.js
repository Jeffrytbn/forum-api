const UserRepository = require('../../../Domains/users/UserRepository');
const AuthenticationRepository = require('../../../Domains/authentications/AuthenticationRepository');
const NewAuth = require('../../../Domains/authentications/entities/NewAuth');
const AuthenticationTokenManager = require('../../security/AuthenticationTokenManager');
const PasswordHash = require('../../security/PasswordHash');
const LoginUserUseCase = require('../LoginUserUseCase');

describe('LoginUserUseCase', () => {
  const buildUseCase = () => {
    const userRepository = new UserRepository();
    const authenticationRepository = new AuthenticationRepository();
    const authenticationTokenManager = new AuthenticationTokenManager();
    const passwordHash = new PasswordHash();

    return {
      userRepository,
      authenticationRepository,
      authenticationTokenManager,
      passwordHash,
      useCase: new LoginUserUseCase({
        userRepository, authenticationRepository, authenticationTokenManager, passwordHash,
      }),
    };
  };

  it('should throw error when payload does not contain needed property', async () => {
    const { useCase } = buildUseCase();

    await expect(useCase.execute({ username: 'dicoding' })).rejects.toThrowError('USER_LOGIN.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload does not meet data type specification', async () => {
    const { useCase } = buildUseCase();

    await expect(useCase.execute({ username: 123, password: {} })).rejects.toThrowError('USER_LOGIN.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrate the login action correctly', async () => {
    const {
      useCase, userRepository, authenticationRepository, authenticationTokenManager, passwordHash,
    } = buildUseCase();

    userRepository.getPasswordByUsername = vi.fn(() => Promise.resolve('encrypted_password'));
    passwordHash.comparePassword = vi.fn(() => Promise.resolve());
    userRepository.getIdByUsername = vi.fn(() => Promise.resolve('user-123'));
    authenticationTokenManager.createAccessToken = vi.fn(() => Promise.resolve('access_token'));
    authenticationTokenManager.createRefreshToken = vi.fn(() => Promise.resolve('refresh_token'));
    authenticationRepository.addToken = vi.fn(() => Promise.resolve());

    const result = await useCase.execute({ username: 'dicoding', password: 'secret' });

    expect(result).toStrictEqual(new NewAuth({ accessToken: 'access_token', refreshToken: 'refresh_token' }));
    expect(userRepository.getPasswordByUsername).toBeCalledWith('dicoding');
    expect(passwordHash.comparePassword).toBeCalledWith('secret', 'encrypted_password');
    expect(userRepository.getIdByUsername).toBeCalledWith('dicoding');
    expect(authenticationTokenManager.createAccessToken).toBeCalledWith({ username: 'dicoding', id: 'user-123' });
    expect(authenticationTokenManager.createRefreshToken).toBeCalledWith({ username: 'dicoding', id: 'user-123' });
    expect(authenticationRepository.addToken).toBeCalledWith('refresh_token');
  });
});
