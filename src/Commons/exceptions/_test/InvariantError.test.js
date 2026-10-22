const ClientError = require('../ClientError');
const InvariantError = require('../InvariantError');

describe('InvariantError', () => {
  it('should create invariant error correctly', () => {
    const error = new InvariantError('pesan error');

    expect(error).toBeInstanceOf(ClientError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toEqual('pesan error');
    expect(error.statusCode).toEqual(400);
    expect(error.name).toEqual('InvariantError');
  });
});
