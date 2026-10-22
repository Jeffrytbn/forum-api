const CommentDetail = require('../CommentDetail');

describe('CommentDetail entities', () => {
  const validPayload = () => ({
    id: 'comment-123',
    username: 'dicoding',
    date: '2021-08-08T07:22:33.555Z',
    content: 'sebuah comment',
    isDelete: false,
  });

  it('should throw error when payload did not contain needed property', () => {
    const payload = validPayload();
    delete payload.username;

    expect(() => new CommentDetail(payload)).toThrowError('COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = { ...validPayload(), isDelete: 'false' };

    expect(() => new CommentDetail(payload)).toThrowError('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when replies is not an array', () => {
    const payload = { ...validPayload(), replies: 'bukan array' };

    expect(() => new CommentDetail(payload)).toThrowError('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should throw error when likeCount is not a number', () => {
    const payload = { ...validPayload(), likeCount: '2' };

    expect(() => new CommentDetail(payload)).toThrowError('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should keep likeCount from payload', () => {
    const commentDetail = new CommentDetail({ ...validPayload(), likeCount: 3 });

    expect(commentDetail.likeCount).toEqual(3);
  });

  it('should create CommentDetail object with original content when comment is not deleted', () => {
    const commentDetail = new CommentDetail(validPayload());

    expect(commentDetail).toEqual({
      id: 'comment-123',
      username: 'dicoding',
      date: '2021-08-08T07:22:33.555Z',
      replies: [],
      likeCount: 0,
      content: 'sebuah comment',
    });
  });

  it('should hide content when comment is deleted', () => {
    const replies = [{ id: 'reply-123' }];

    const commentDetail = new CommentDetail({ ...validPayload(), isDelete: true, replies });

    expect(commentDetail.content).toEqual('**komentar telah dihapus**');
    expect(commentDetail.replies).toStrictEqual(replies);
  });
});
