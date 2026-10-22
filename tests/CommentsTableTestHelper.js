const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentsTableTestHelper = {
  async addComment({
    id = 'comment-123',
    threadId = 'thread-123',
    owner = 'user-123',
    content = 'sebuah comment',
    date = '2021-08-08T07:22:33.555Z',
    isDelete = false,
  } = {}) {
    const query = {
      text: 'INSERT INTO comments(id, thread_id, owner, content, date, is_delete) VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, threadId, owner, content, date, isDelete],
    };

    await pool.query(query);
  },

  async findCommentsById(id) {
    const result = await pool.query({ text: 'SELECT * FROM comments WHERE id = $1', values: [id] });

    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

module.exports = CommentsTableTestHelper;
