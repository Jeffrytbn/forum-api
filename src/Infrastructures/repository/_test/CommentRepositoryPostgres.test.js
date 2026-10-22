const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');

describe('CommentRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment and return added comment correctly', async () => {
      const newComment = new NewComment({ content: 'sebuah comment', threadId: 'thread-123', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => '123');

      const addedComment = await commentRepositoryPostgres.addComment(newComment);

      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].thread_id).toEqual('thread-123');
      expect(comments[0].is_delete).toEqual(false);
      expect(addedComment).toStrictEqual(new AddedComment({ id: 'comment-123', content: 'sebuah comment', owner: 'user-123' }));
    });
  });

  describe('verifyCommentAvailability function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentAvailability('comment-xxx', 'thread-123')).rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when comment belongs to another thread', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentAvailability('comment-123', 'thread-lain')).rejects.toThrowError(NotFoundError);
    });

    it('should not throw error when comment found in the thread', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentAvailability('comment-123', 'thread-123')).resolves.toBeUndefined();
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw NotFoundError when comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-xxx', 'user-123')).rejects.toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when user is not the owner', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-456')).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw error when user is the owner', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123', owner: 'user-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-123')).resolves.toBeUndefined();
    });
  });

  describe('deleteComment function', () => {
    it('should soft delete comment (row stays, is_delete becomes true)', async () => {
      await CommentsTableTestHelper.addComment({ id: 'comment-123' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await commentRepositoryPostgres.deleteComment('comment-123');

      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
      expect(comments[0].content).toEqual('sebuah comment');
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return empty array when thread has no comments', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');

      expect(comments).toStrictEqual([]);
    });

    it('should return comments of the thread ordered by date ascending', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-2', owner: 'user-456', content: 'komentar kedua', date: '2021-08-08T07:26:21.338Z', isDelete: true,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-1', owner: 'user-123', content: 'komentar pertama', date: '2021-08-08T07:22:33.555Z',
      });
      await ThreadsTableTestHelper.addThread({ id: 'thread-lain', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-lain', threadId: 'thread-lain' });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');

      expect(comments).toStrictEqual([
        {
          id: 'comment-1', username: 'dicoding', date: '2021-08-08T07:22:33.555Z', content: 'komentar pertama', isDelete: false,
        },
        {
          id: 'comment-2', username: 'johndoe', date: '2021-08-08T07:26:21.338Z', content: 'komentar kedua', isDelete: true,
        },
      ]);
    });
  });
});
