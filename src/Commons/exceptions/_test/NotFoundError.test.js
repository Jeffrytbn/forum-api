const ClientError = require('../ClientError');
const NotFoundError = require('../NotFoundError');

describe('NotFoundError', () => {
  it('should create not found error correctly', () => {
    const error = new NotFoundError('pesan error');

    expect(error).toBeInstanceOf(ClientError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toEqual('pesan error');
    expect(error.statusCode).toEqual(404);
    expect(error.name).toEqual('NotFoundError');
  });
});
