const request = require('supertest');
const pool = require('../../../../../Infrastructures/database/postgres/pool');
const container = require('../../../../../Infrastructures/container/container');
const createServer = require('../../../../../Infrastructures/http/createServer');
const ServerTestHelper = require('../../../../../../tests/ServerTestHelper');
const UsersTableTestHelper = require('../../../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../../../tests/RepliesTableTestHelper');
const LikesTableTestHelper = require('../../../../../../tests/LikesTableTestHelper');

describe('/threads endpoint', () => {
  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('when POST /threads', () => {
    it('should response 201 and persisted thread', async () => {
      const accessToken = await ServerTestHelper.getAccessToken({ id: 'user-123', username: 'dicoding' });

      const response = await request(createServer(container))
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedThread).toEqual({
        id: expect.any(String), title: 'sebuah thread', owner: 'user-123',
      });
      expect(await ThreadsTableTestHelper.findThreadsById(response.body.data.addedThread.id)).toHaveLength(1);
    });

    it('should use authenticated user as owner even if payload contains another owner', async () => {
      const accessToken = await ServerTestHelper.getAccessToken({ id: 'user-123', username: 'dicoding' });

      const response = await request(createServer(container))
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread', owner: 'user-palsu' });

      expect(response.status).toEqual(201);
      expect(response.body.data.addedThread.owner).toEqual('user-123');
    });

    it('should response 400 when payload not contain needed property', async () => {
      const accessToken = await ServerTestHelper.getAccessToken();

      const response = await request(createServer(container))
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'sebuah thread' });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when payload wrong data type', async () => {
      const accessToken = await ServerTestHelper.getAccessToken();

      const response = await request(createServer(container))
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 123, body: ['sebuah body thread'] });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena tipe data tidak sesuai');
    });

    it('should response 401 when request without access token', async () => {
      const response = await request(createServer(container))
        .post('/threads')
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 401 when access token is invalid', async () => {
      const response = await request(createServer(container))
        .post('/threads')
        .set('Authorization', 'Bearer token_ngawur')
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 401 when authorization scheme is not Bearer', async () => {
      const accessToken = await ServerTestHelper.getAccessToken();

      const response = await request(createServer(container))
        .post('/threads')
        .set('Authorization', `Basic ${accessToken}`)
        .send({ title: 'sebuah thread', body: 'sebuah body thread' });

      expect(response.status).toEqual(401);
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should response 404 when thread not found', async () => {
      const response = await request(createServer(container)).get('/threads/thread-xxx');

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 200 with thread detail without access token', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123', title: 'sebuah thread', body: 'sebuah body thread', owner: 'user-123', date: '2021-08-08T07:19:09.775Z',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-2', owner: 'user-123', content: 'komentar kedua', date: '2021-08-08T07:26:21.338Z', isDelete: true,
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-1', owner: 'user-456', content: 'komentar pertama', date: '2021-08-08T07:22:33.555Z',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-2', commentId: 'comment-1', owner: 'user-123', content: 'balasan kedua', date: '2021-08-08T08:07:01.522Z',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-1', commentId: 'comment-1', owner: 'user-456', content: 'balasan pertama', date: '2021-08-08T07:59:48.766Z', isDelete: true,
      });
      await LikesTableTestHelper.addLike({ commentId: 'comment-1', owner: 'user-123' });
      await LikesTableTestHelper.addLike({ commentId: 'comment-1', owner: 'user-456' });

      const response = await request(createServer(container)).get('/threads/thread-123');

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.thread).toEqual({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comments: [
          {
            id: 'comment-1',
            username: 'johndoe',
            date: '2021-08-08T07:22:33.555Z',
            replies: [
              {
                id: 'reply-1', content: '**balasan telah dihapus**', date: '2021-08-08T07:59:48.766Z', username: 'johndoe',
              },
              {
                id: 'reply-2', content: 'balasan kedua', date: '2021-08-08T08:07:01.522Z', username: 'dicoding',
              },
            ],
            content: 'komentar pertama',
            likeCount: 2,
          },
          {
            id: 'comment-2',
            username: 'dicoding',
            date: '2021-08-08T07:26:21.338Z',
            replies: [],
            content: '**komentar telah dihapus**',
            likeCount: 0,
          },
        ],
      });
    });

    it('should response 200 with empty comments when thread has no comment', async () => {
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      const response = await request(createServer(container)).get('/threads/thread-123');

      expect(response.status).toEqual(200);
      expect(response.body.data.thread.comments).toEqual([]);
    });
  });
});
