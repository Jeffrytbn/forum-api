const ClientError = require('../ClientError');
const AuthenticationError = require('../AuthenticationError');

describe('AuthenticationError', () => {
  it('should create authentication error correctly', () => {
    const error = new AuthenticationError('pesan error');

    expect(error).toBeInstanceOf(ClientError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toEqual('pesan error');
    expect(error.statusCode).toEqual(401);
    expect(error.name).toEqual('AuthenticationError');
  });
});
