const pool = require('../src/Infrastructures/database/postgres/pool');

const RepliesTableTestHelper = {
  async addReply({
    id = 'reply-123',
    commentId = 'comment-123',
    owner = 'user-123',
    content = 'sebuah balasan',
    date = '2021-08-08T07:59:48.766Z',
    isDelete = false,
  } = {}) {
    const query = {
      text: 'INSERT INTO replies(id, comment_id, owner, content, date, is_delete) VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, commentId, owner, content, date, isDelete],
    };

    await pool.query(query);
  },

  async findRepliesById(id) {
    const result = await pool.query({ text: 'SELECT * FROM replies WHERE id = $1', values: [id] });

    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM replies WHERE 1=1');
  },
};

module.exports = RepliesTableTestHelper;
