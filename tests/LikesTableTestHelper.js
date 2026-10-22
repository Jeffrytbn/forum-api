const pool = require('../src/Infrastructures/database/postgres/pool');

const LikesTableTestHelper = {
  async addLike({ commentId = 'comment-123', owner = 'user-123' } = {}) {
    await pool.query({
      text: 'INSERT INTO comment_likes(comment_id, owner) VALUES($1, $2)',
      values: [commentId, owner],
    });
  },

  async findLike(commentId, owner) {
    const result = await pool.query({
      text: 'SELECT * FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    });

    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comment_likes WHERE 1=1');
  },
};

module.exports = LikesTableTestHelper;
