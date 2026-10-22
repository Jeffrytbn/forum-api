const NewAuth = require('../NewAuth');

describe('NewAuth entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    expect(() => new NewAuth({ accessToken: 'accessToken' })).toThrowError('NEW_AUTH.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    expect(() => new NewAuth({ accessToken: 'accessToken', refreshToken: 1234 })).toThrowError('NEW_AUTH.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewAuth entities correctly', () => {
    const newAuth = new NewAuth({ accessToken: 'accessToken', refreshToken: 'refreshToken' });

    expect(newAuth).toBeInstanceOf(NewAuth);
    expect(newAuth.accessToken).toEqual('accessToken');
    expect(newAuth.refreshToken).toEqual('refreshToken');
  });
});
