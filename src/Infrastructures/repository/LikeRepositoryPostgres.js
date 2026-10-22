const LikeRepository = require('../../Domains/likes/LikeRepository');

class LikeRepositoryPostgres extends LikeRepository {
  constructor(pool) {
    super();
    this._pool = pool;
  }

  async verifyLikeExists(commentId, owner) {
    const query = {
      text: 'SELECT 1 FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    return result.rowCount > 0;
  }

  async addLike(commentId, owner) {
    const query = {
      text: 'INSERT INTO comment_likes(comment_id, owner) VALUES($1, $2)',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }

  async deleteLike(commentId, owner) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }

  async getLikeCountsByThreadId(threadId) {
    const query = {
      text: `SELECT comment_likes.comment_id AS "commentId", COUNT(*)::int AS "likeCount"
             FROM comment_likes
             INNER JOIN comments ON comments.id = comment_likes.comment_id
             WHERE comments.thread_id = $1
             GROUP BY comment_likes.comment_id`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }
}

module.exports = LikeRepositoryPostgres;
