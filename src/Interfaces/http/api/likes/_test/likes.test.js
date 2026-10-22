const request = require('supertest');
const pool = require('../../../../../Infrastructures/database/postgres/pool');
const container = require('../../../../../Infrastructures/container/container');
const createServer = require('../../../../../Infrastructures/http/createServer');
const ServerTestHelper = require('../../../../../../tests/ServerTestHelper');
const UsersTableTestHelper = require('../../../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../../../tests/CommentsTableTestHelper');
const LikesTableTestHelper = require('../../../../../../tests/LikesTableTestHelper');

describe('/threads/{threadId}/comments/{commentId}/likes endpoint', () => {
  const prepare = async () => {
    const accessToken = await ServerTestHelper.getAccessToken({ id: 'user-123', username: 'dicoding' });
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });

    return accessToken;
  };

  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should response 200 and like the comment when not liked yet', async () => {
      const accessToken = await prepare();
      const server = createServer(container);

      const response = await request(server)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(await LikesTableTestHelper.findLike('comment-123', 'user-123')).toHaveLength(1);

      const detail = await request(server).get('/threads/thread-123');
      expect(detail.body.data.thread.comments[0].likeCount).toEqual(1);
    });

    it('should response 200 and unlike the comment when already liked', async () => {
      const accessToken = await prepare();
      await LikesTableTestHelper.addLike({ commentId: 'comment-123', owner: 'user-123' });
      const server = createServer(container);

      const response = await request(server)
        .put('/threads/thread-123/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(await LikesTableTestHelper.findLike('comment-123', 'user-123')).toHaveLength(0);

      const detail = await request(server).get('/threads/thread-123');
      expect(detail.body.data.thread.comments[0].likeCount).toEqual(0);
    });

    it('should count likes from different users', async () => {
      const token1 = await prepare();
      const token2 = await ServerTestHelper.getAccessToken({ id: 'user-456', username: 'johndoe' });
      const server = createServer(container);

      await request(server).put('/threads/thread-123/comments/comment-123/likes').set('Authorization', `Bearer ${token1}`);
      await request(server).put('/threads/thread-123/comments/comment-123/likes').set('Authorization', `Bearer ${token2}`);

      const detail = await request(server).get('/threads/thread-123');
      expect(detail.body.data.thread.comments[0].likeCount).toEqual(2);
    });

    it('should response 404 when thread not found', async () => {
      const accessToken = await prepare();

      const response = await request(createServer(container))
        .put('/threads/thread-xxx/comments/comment-123/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 when comment not found', async () => {
      const accessToken = await prepare();

      const response = await request(createServer(container))
        .put('/threads/thread-123/comments/comment-xxx/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 401 when request without access token', async () => {
      await prepare();

      const response = await request(createServer(container)).put('/threads/thread-123/comments/comment-123/likes');

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });
  });
});
