const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const LikesTableTestHelper = require('../../../../tests/LikesTableTestHelper');
const pool = require('../../database/postgres/pool');
const LikeRepositoryPostgres = require('../LikeRepositoryPostgres');

describe('LikeRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('verifyLikeExists function', () => {
    it('should return false when user has not liked the comment', async () => {
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool);

      const result = await likeRepositoryPostgres.verifyLikeExists('comment-123', 'user-123');

      expect(result).toEqual(false);
    });

    it('should return true when user already liked the comment', async () => {
      await LikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-123' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool);

      const result = await likeRepositoryPostgres.verifyLikeExists('comment-123', 'user-123');

      expect(result).toEqual(true);
    });
  });

  describe('addLike function', () => {
    it('should persist like', async () => {
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool);

      await likeRepositoryPostgres.addLike('comment-123', 'user-123');

      expect(await LikesTableTestHelper.findLike('comment-123', 'user-123')).toHaveLength(1);
    });
  });

  describe('deleteLike function', () => {
    it('should remove only the like of that user', async () => {
      await LikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-123' });
      await LikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-456' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool);

      await likeRepositoryPostgres.deleteLike('comment-123', 'user-123');

      expect(await LikesTableTestHelper.findLike('comment-123', 'user-123')).toHaveLength(0);
      expect(await LikesTableTestHelper.findLike('comment-123', 'user-456')).toHaveLength(1);
    });
  });

  describe('getLikeCountsByThreadId function', () => {
    it('should return empty array when thread has no likes', async () => {
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool);

      const counts = await likeRepositoryPostgres.getLikeCountsByThreadId('thread-123');

      expect(counts).toStrictEqual([]);
    });

    it('should return like count per comment of the thread only', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-456', threadId: 'thread-123', owner: 'user-456' });
      await LikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-123' });
      await LikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-456' });
      await LikesTableTestHelper.addLike({ commentId: 'comment-456', owner: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-lain', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-lain', threadId: 'thread-lain' });
      await LikesTableTestHelper.addLike({ commentId: 'comment-lain', owner: 'user-123' });
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool);

      const counts = await likeRepositoryPostgres.getLikeCountsByThreadId('thread-123');

      expect(counts).toHaveLength(2);
      expect(counts).toEqual(expect.arrayContaining([
        { commentId: 'comment-123', likeCount: 2 },
        { commentId: 'comment-456', likeCount: 1 },
      ]));
    });
  });
});
