const request = require('supertest');
const pool = require('../../../../../Infrastructures/database/postgres/pool');
const container = require('../../../../../Infrastructures/container/container');
const createServer = require('../../../../../Infrastructures/http/createServer');
const UsersTableTestHelper = require('../../../../../../tests/UsersTableTestHelper');

describe('/users endpoint', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('when POST /users', () => {
    const payload = { username: 'dicoding', password: 'secret', fullname: 'Dicoding Indonesia' };

    it('should response 201 and persisted user', async () => {
      const response = await request(createServer(container)).post('/users').send(payload);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedUser).toEqual({
        id: expect.any(String), username: 'dicoding', fullname: 'Dicoding Indonesia',
      });

      const users = await UsersTableTestHelper.findUsersById(response.body.data.addedUser.id);
      expect(users).toHaveLength(1);
      expect(users[0].password).not.toEqual('secret');
    });

    it('should response 400 when request payload not contain needed property', async () => {
      const response = await request(createServer(container)).post('/users').send({ fullname: 'Dicoding Indonesia', password: 'secret' });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      const response = await request(createServer(container)).post('/users').send({ username: 'dicoding', password: 'secret', fullname: ['Dicoding Indonesia'] });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena tipe data tidak sesuai');
    });

    it('should response 400 when username more than 50 character', async () => {
      const response = await request(createServer(container)).post('/users').send({ ...payload, username: 'a'.repeat(51) });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena karakter username melebihi batas limit');
    });

    it('should response 400 when username contains restricted character', async () => {
      const response = await request(createServer(container)).post('/users').send({ ...payload, username: 'dicoding indonesia' });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena username mengandung karakter terlarang');
    });

    it('should response 400 when username unavailable', async () => {
      await UsersTableTestHelper.addUser({ username: 'dicoding' });

      const response = await request(createServer(container)).post('/users').send(payload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak tersedia');
    });
  });
});
