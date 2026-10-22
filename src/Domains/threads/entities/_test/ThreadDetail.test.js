const ThreadDetail = require('../ThreadDetail');

describe('ThreadDetail entities', () => {
  const validPayload = () => ({
    id: 'thread-123',
    title: 'sebuah thread',
    body: 'sebuah body',
    date: '2021-08-08T07:19:09.775Z',
    username: 'dicoding',
    comments: [],
  });

  it('should throw error when payload did not contain needed property', () => {
    const payload = validPayload();
    delete payload.username;

    expect(() => new ThreadDetail(payload)).toThrowError('THREAD_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = { ...validPayload(), comments: 'bukan array' };

    expect(() => new ThreadDetail(payload)).toThrowError('THREAD_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create ThreadDetail object correctly', () => {
    const payload = validPayload();

    const threadDetail = new ThreadDetail(payload);

    expect(threadDetail).toEqual(payload);
  });
});
