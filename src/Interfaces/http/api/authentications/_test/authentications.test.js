const request = require('supertest');
const pool = require('../../../../../Infrastructures/database/postgres/pool');
const container = require('../../../../../Infrastructures/container/container');
const createServer = require('../../../../../Infrastructures/http/createServer');
const UsersTableTestHelper = require('../../../../../../tests/UsersTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../../../tests/AuthenticationsTableTestHelper');

describe('/authentications endpoint', () => {
  const registerUser = (server) => request(server).post('/users').send({
    username: 'dicoding', password: 'secret', fullname: 'Dicoding Indonesia',
  });

  afterEach(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('when POST /authentications', () => {
    it('should response 201 and new authentication', async () => {
      const server = createServer(container);
      await registerUser(server);

      const response = await request(server).post('/authentications').send({ username: 'dicoding', password: 'secret' });

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toEqual(expect.any(String));
      expect(response.body.data.refreshToken).toEqual(expect.any(String));
      expect(await AuthenticationsTableTestHelper.findToken(response.body.data.refreshToken)).toHaveLength(1);
    });

    it('should response 400 when username not found', async () => {
      const response = await request(createServer(container)).post('/authentications').send({ username: 'dicoding', password: 'secret' });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('username tidak ditemukan');
    });

    it('should response 401 when password is wrong', async () => {
      const server = createServer(container);
      await registerUser(server);

      const response = await request(server).post('/authentications').send({ username: 'dicoding', password: 'wrong_password' });

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('kredensial yang Anda masukkan salah');
    });

    it('should response 400 when payload not contain needed property', async () => {
      const response = await request(createServer(container)).post('/authentications').send({ username: 'dicoding' });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('harus mengirimkan username dan password');
    });

    it('should response 400 when payload wrong data type', async () => {
      const response = await request(createServer(container)).post('/authentications').send({ username: 123, password: 'secret' });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('username dan password harus string');
    });
  });

  describe('when PUT /authentications', () => {
    it('should return 200 and new access token', async () => {
      const server = createServer(container);
      await registerUser(server);
      const login = await request(server).post('/authentications').send({ username: 'dicoding', password: 'secret' });

      const response = await request(server).put('/authentications').send({ refreshToken: login.body.data.refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toEqual(expect.any(String));
    });

    it('should return 400 when payload not contain refresh token', async () => {
      const response = await request(createServer(container)).put('/authentications').send({});

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('harus mengirimkan token refresh');
    });

    it('should return 400 when refresh token not string', async () => {
      const response = await request(createServer(container)).put('/authentications').send({ refreshToken: 123 });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('refresh token harus string');
    });

    it('should return 400 when refresh token not valid', async () => {
      const response = await request(createServer(container)).put('/authentications').send({ refreshToken: 'invalid_refresh_token' });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('refresh token tidak valid');
    });

    it('should return 400 when refresh token not registered in database', async () => {
      const server = createServer(container);
      await registerUser(server);
      const login = await request(server).post('/authentications').send({ username: 'dicoding', password: 'secret' });
      await AuthenticationsTableTestHelper.cleanTable();

      const response = await request(server).put('/authentications').send({ refreshToken: login.body.data.refreshToken });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('refresh token tidak ditemukan di database');
    });
  });

  describe('when DELETE /authentications', () => {
    it('should response 200 if refresh token valid', async () => {
      const server = createServer(container);
      await AuthenticationsTableTestHelper.addToken('refresh_token');

      const response = await request(server).delete('/authentications').send({ refreshToken: 'refresh_token' });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(await AuthenticationsTableTestHelper.findToken('refresh_token')).toHaveLength(0);
    });

    it('should response 400 if refresh token not registered in database', async () => {
      const response = await request(createServer(container)).delete('/authentications').send({ refreshToken: 'refresh_token' });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('refresh token tidak ditemukan di database');
    });

    it('should response 400 if payload not contain refresh token', async () => {
      const response = await request(createServer(container)).delete('/authentications').send({});

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('harus mengirimkan token refresh');
    });

    it('should response 400 if refresh token not string', async () => {
      const response = await request(createServer(container)).delete('/authentications').send({ refreshToken: 123 });

      expect(response.status).toEqual(400);
      expect(response.body.message).toEqual('refresh token harus string');
    });
  });
});
