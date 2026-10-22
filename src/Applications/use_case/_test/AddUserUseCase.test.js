const RegisterUser = require('../../../Domains/users/entities/RegisterUser');
const RegisteredUser = require('../../../Domains/users/entities/RegisteredUser');
const UserRepository = require('../../../Domains/users/UserRepository');
const PasswordHash = require('../../security/PasswordHash');
const AddUserUseCase = require('../AddUserUseCase');

describe('AddUserUseCase', () => {
  it('should orchestrate the add user action correctly', async () => {
    const useCasePayload = { username: 'dicoding', password: 'secret', fullname: 'Dicoding Indonesia' };

    const mockUserRepository = new UserRepository();
    const mockPasswordHash = new PasswordHash();
    mockUserRepository.verifyAvailableUsername = vi.fn(() => Promise.resolve());
    mockPasswordHash.hash = vi.fn(() => Promise.resolve('encrypted_password'));
    mockUserRepository.addUser = vi.fn(() => Promise.resolve(
      new RegisteredUser({ id: 'user-123', username: 'dicoding', fullname: 'Dicoding Indonesia' }),
    ));

    const addUserUseCase = new AddUserUseCase({
      userRepository: mockUserRepository,
      passwordHash: mockPasswordHash,
    });

    const registeredUser = await addUserUseCase.execute(useCasePayload);

    expect(registeredUser).toStrictEqual(new RegisteredUser({
      id: 'user-123', username: 'dicoding', fullname: 'Dicoding Indonesia',
    }));
    expect(mockUserRepository.verifyAvailableUsername).toBeCalledWith('dicoding');
    expect(mockPasswordHash.hash).toBeCalledWith('secret');
    expect(mockUserRepository.addUser).toBeCalledWith(new RegisterUser({
      username: 'dicoding', password: 'encrypted_password', fullname: 'Dicoding Indonesia',
    }));
  });
});
