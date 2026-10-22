const ClientError = require('../ClientError');
const AuthorizationError = require('../AuthorizationError');

describe('AuthorizationError', () => {
  it('should create authorization error correctly', () => {
    const error = new AuthorizationError('pesan error');

    expect(error).toBeInstanceOf(ClientError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toEqual('pesan error');
    expect(error.statusCode).toEqual(403);
    expect(error.name).toEqual('AuthorizationError');
  });
});
