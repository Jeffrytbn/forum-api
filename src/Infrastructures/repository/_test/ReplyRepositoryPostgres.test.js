const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const NewReply = require('../../../Domains/replies/entities/NewReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const pool = require('../../database/postgres/pool');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');

describe('ReplyRepositoryPostgres', () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist new reply and return added reply correctly', async () => {
      const newReply = new NewReply({ content: 'sebuah balasan', commentId: 'comment-123', owner: 'user-456' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, () => '123');

      const addedReply = await replyRepositoryPostgres.addReply(newReply);

      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].comment_id).toEqual('comment-123');
      expect(replies[0].is_delete).toEqual(false);
      expect(addedReply).toStrictEqual(new AddedReply({ id: 'reply-123', content: 'sebuah balasan', owner: 'user-456' }));
    });
  });

  describe('verifyReplyAvailability function', () => {
    it('should throw NotFoundError when reply not found', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyAvailability('reply-xxx', 'comment-123')).rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when reply belongs to another comment', async () => {
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyAvailability('reply-123', 'comment-lain')).rejects.toThrowError(NotFoundError);
    });

    it('should not throw error when reply found in the comment', async () => {
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyAvailability('reply-123', 'comment-123')).resolves.toBeUndefined();
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw NotFoundError when reply not found', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-xxx', 'user-123')).rejects.toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when user is not the owner', async () => {
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-456')).rejects.toThrowError(AuthorizationError);
    });

    it('should not throw error when user is the owner', async () => {
      await RepliesTableTestHelper.addReply({ id: 'reply-123', owner: 'user-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-123')).resolves.toBeUndefined();
    });
  });

  describe('deleteReply function', () => {
    it('should soft delete reply (row stays, is_delete becomes true)', async () => {
      await RepliesTableTestHelper.addReply({ id: 'reply-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await replyRepositoryPostgres.deleteReply('reply-123');

      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);
      expect(replies[0].content).toEqual('sebuah balasan');
    });
  });

  describe('getRepliesByThreadId function', () => {
    it('should return empty array when thread has no replies', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      expect(replies).toStrictEqual([]);
    });

    it('should return replies of the thread ordered by date ascending', async () => {
      await RepliesTableTestHelper.addReply({
        id: 'reply-2', owner: 'user-123', content: 'balasan kedua', date: '2021-08-08T08:07:01.522Z',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-1', owner: 'user-456', content: 'balasan pertama', date: '2021-08-08T07:59:48.766Z', isDelete: true,
      });
      await ThreadsTableTestHelper.addThread({ id: 'thread-lain', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-lain', threadId: 'thread-lain' });
      await RepliesTableTestHelper.addReply({ id: 'reply-lain', commentId: 'comment-lain' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const replies = await replyRepositoryPostgres.getRepliesByThreadId('thread-123');

      expect(replies).toStrictEqual([
        {
          id: 'reply-1', commentId: 'comment-123', username: 'johndoe', date: '2021-08-08T07:59:48.766Z', content: 'balasan pertama', isDelete: true,
        },
        {
          id: 'reply-2', commentId: 'comment-123', username: 'dicoding', date: '2021-08-08T08:07:01.522Z', content: 'balasan kedua', isDelete: false,
        },
      ]);
    });
  });
});
