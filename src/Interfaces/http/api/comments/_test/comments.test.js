const request = require('supertest');
const pool = require('../../../../../Infrastructures/database/postgres/pool');
const container = require('../../../../../Infrastructures/container/container');
const createServer = require('../../../../../Infrastructures/http/createServer');
const ServerTestHelper = require('../../../../../../tests/ServerTestHelper');
const UsersTableTestHelper = require('../../../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../../../tests/CommentsTableTestHelper');

describe('/threads/{threadId}/comments endpoint', () => {
  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 201 and persisted comment', async () => {
      const accessToken = await ServerTestHelper.getAccessToken({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      const response = await request(createServer(container))
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedComment).toEqual({
        id: expect.any(String), content: 'sebuah comment', owner: 'user-123',
      });
      expect(await CommentsTableTestHelper.findCommentsById(response.body.data.addedComment.id)).toHaveLength(1);
    });

    it('should response 404 when thread not found', async () => {
      const accessToken = await ServerTestHelper.getAccessToken();

      const response = await request(createServer(container))
        .post('/threads/thread-xxx/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 400 when payload not contain needed property', async () => {
      const accessToken = await ServerTestHelper.getAccessToken({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      const response = await request(createServer(container))
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat komentar baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when payload wrong data type', async () => {
      const accessToken = await ServerTestHelper.getAccessToken({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      const response = await request(createServer(container))
        .post('/threads/thread-123/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 123 });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('tidak dapat membuat komentar baru karena tipe data tidak sesuai');
    });

    it('should response 401 when request without access token', async () => {
      const response = await request(createServer(container))
        .post('/threads/thread-123/comments')
        .send({ content: 'sebuah comment' });

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    const prepare = async () => {
      const accessToken = await ServerTestHelper.getAccessToken({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

      return accessToken;
    };

    it('should response 200 and soft delete the comment', async () => {
      const accessToken = await prepare();
      const server = createServer(container);

      const response = await request(server)
        .delete('/threads/thread-123/comments/comment-123')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');

      const comments = await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);

      const detail = await request(server).get('/threads/thread-123');
      expect(detail.body.data.thread.comments[0].content).toEqual('**komentar telah dihapus**');
    });

    it('should response 403 when user is not the comment owner', async () => {
      await prepare();
      const otherToken = await ServerTestHelper.getAccessToken({ id: 'user-456', username: 'johndoe' });

      const response = await request(createServer(container))
        .delete('/threads/thread-123/comments/comment-123')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
      expect((await CommentsTableTestHelper.findCommentsById('comment-123'))[0].is_delete).toEqual(false);
    });

    it('should response 404 when thread not found', async () => {
      const accessToken = await prepare();

      const response = await request(createServer(container))
        .delete('/threads/thread-xxx/comments/comment-123')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 when comment not found', async () => {
      const accessToken = await prepare();

      const response = await request(createServer(container))
        .delete('/threads/thread-123/comments/comment-xxx')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 404 when comment belongs to another thread', async () => {
      const accessToken = await prepare();
      await ThreadsTableTestHelper.addThread({ id: 'thread-456', owner: 'user-123' });

      const response = await request(createServer(container))
        .delete('/threads/thread-456/comments/comment-123')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
    });

    it('should response 401 when request without access token', async () => {
      await prepare();

      const response = await request(createServer(container)).delete('/threads/thread-123/comments/comment-123');

      expect(response.status).toEqual(401);
    });
  });
});
