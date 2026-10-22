class CommentDetail {
  constructor(payload) {
    this._verifyPayload(payload);

    const {
      id, username, date, content, isDelete, replies = [], likeCount = 0,
    } = payload;

    this.id = id;
    this.username = username;
    this.date = date;
    this.likeCount = likeCount;
    this.replies = replies;
    this.content = isDelete ? '**komentar telah dihapus**' : content;
  }

  _verifyPayload({
    id, username, date, content, isDelete, replies = [], likeCount = 0,
  }) {
    if (!id || !username || !date || !content || isDelete === undefined) {
      throw new Error('COMMENT_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string'
      || typeof username !== 'string'
      || typeof date !== 'string'
      || typeof content !== 'string'
      || typeof isDelete !== 'boolean'
      || !Array.isArray(replies)
      || typeof likeCount !== 'number'
    ) {
      throw new Error('COMMENT_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = CommentDetail;
