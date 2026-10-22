const request = require('supertest');
const pool = require('../../../../../Infrastructures/database/postgres/pool');
const container = require('../../../../../Infrastructures/container/container');
const createServer = require('../../../../../Infrastructures/http/createServer');
const ServerTestHelper = require('../../../../../../tests/ServerTestHelper');
const UsersTableTestHelper = require('../../../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../../../tests/RepliesTableTestHelper');

describe('/threads/{threadId}/comments/{commentId}/replies endpoint', () => {
  const prepare = async () => {
    const accessToken = await ServerTestHelper.getAccessToken({ id: 'user-123', username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

    return accessToken;
  };

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {
    it('should response 201 and persisted reply', async () => {
      const accessToken = await prepare();

      const response = await request(createServer(container))
        .post('/threads/thread-123/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedReply).toEqual({
        id: expect.any(String), content: 'sebuah balasan', owner: 'user-123',
      });
      expect(await RepliesTableTestHelper.findRepliesById(response.body.data.addedReply.id)).toHaveLength(1);
    });

    it('should response 404 when thread not found', async () => {
      const accessToken = await prepare();

      const response = await request(createServer(container))
        .post('/threads/thread-xxx/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 when comment not found', async () => {
      const accessToken = await prepare();

      const response = await request(createServer(container))
        .post('/threads/thread-123/comments/comment-xxx/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah balasan' });

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 400 when payload not contain needed property', async () => {
      const accessToken = await prepare();

      const response = await request(createServer(container))
        .post('/threads/thread-123/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('tidak dapat membuat balasan baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when payload wrong data type', async () => {
      const accessToken = await prepare();

      const response = await request(createServer(container))
        .post('/threads/thread-123/comments/comment-123/replies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: { text: 'balasan' } });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('tidak dapat membuat balasan baru karena tipe data tidak sesuai');
    });

    it('should response 401 when request without access token', async () => {
      await prepare();

      const response = await request(createServer(container))
        .post('/threads/thread-123/comments/comment-123/replies')
        .send({ content: 'sebuah balasan' });

      expect(response.status).toEqual(401);
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    const url = (threadId = 'thread-123', commentId = 'comment-123', replyId = 'reply-123') => `/threads/${threadId}/comments/${commentId}/replies/${replyId}`;

    it('should response 200 and soft delete the reply', async () => {
      const accessToken = await prepare();
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-123' });
      const server = createServer(container);

      const response = await request(server).delete(url()).set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');

      const replies = await RepliesTableTestHelper.findRepliesById('reply-123');
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);

      const detail = await request(server).get('/threads/thread-123');
      expect(detail.body.data.thread.comments[0].replies[0].content).toEqual('**balasan telah dihapus**');
    });

    it('should response 403 when user is not the reply owner', async () => {
      await prepare();
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-123' });
      const otherToken = await ServerTestHelper.getAccessToken({ id: 'user-456', username: 'johndoe' });

      const response = await request(createServer(container)).delete(url()).set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
      expect((await RepliesTableTestHelper.findRepliesById('reply-123'))[0].is_delete).toEqual(false);
    });

    it('should response 404 when thread not found', async () => {
      const accessToken = await prepare();
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-123' });

      const response = await request(createServer(container)).delete(url('thread-xxx')).set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 when comment not found', async () => {
      const accessToken = await prepare();
      await RepliesTableTestHelper.addReply({ id: 'reply-123', commentId: 'comment-123', owner: 'user-123' });

      const response = await request(createServer(container)).delete(url('thread-123', 'comment-xxx')).set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 404 when reply not found', async () => {
      const accessToken = await prepare();

      const response = await request(createServer(container)).delete(url('thread-123', 'comment-123', 'reply-xxx')).set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('balasan tidak ditemukan');
    });

    it('should response 401 when request without access token', async () => {
      await prepare();

      const response = await request(createServer(container)).delete(url());

      expect(response.status).toEqual(401);
    });
  });
});
