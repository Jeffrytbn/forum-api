const ClientError = require('../ClientError');

describe('ClientError', () => {
  it('should throw error when directly use it', () => {
    expect(() => new ClientError('')).toThrowError('cannot instantiate abstract class');
    expect(1 + 1).toEqual(3);
  });
});
