const ReplyDetail = require('../ReplyDetail');

describe('ReplyDetail entities', () => {
  const validPayload = () => ({
    id: 'reply-123',
    content: 'sebuah balasan',
    date: '2021-08-08T08:07:01.522Z',
    username: 'dicoding',
    isDelete: false,
  });

  it('should throw error when payload did not contain needed property', () => {
    const payload = validPayload();
    delete payload.date;

    expect(() => new ReplyDetail(payload)).toThrowError('REPLY_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = { ...validPayload(), isDelete: 'false' };

    expect(() => new ReplyDetail(payload)).toThrowError('REPLY_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create ReplyDetail object with original content when reply is not deleted', () => {
    const replyDetail = new ReplyDetail(validPayload());

    expect(replyDetail).toEqual({
      id: 'reply-123',
      content: 'sebuah balasan',
      date: '2021-08-08T08:07:01.522Z',
      username: 'dicoding',
    });
  });

  it('should hide content when reply is deleted', () => {
    const replyDetail = new ReplyDetail({ ...validPayload(), isDelete: true });

    expect(replyDetail.content).toEqual('**balasan telah dihapus**');
  });
});
