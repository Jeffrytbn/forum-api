const request = require('supertest');
const createServer = require('../createServer');
const container = require('../../container/container');
const pool = require('../../database/postgres/pool');

describe('HTTP server', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('should response 404 when request unregistered route', async () => {
    const response = await request(createServer(container)).get('/unregisteredRoute');

    expect(response.status).toEqual(404);
    expect(response.body.status).toEqual('fail');
    expect(response.body.message).toEqual('route tidak ditemukan');
  });

  it('should response 400 when request body is not a valid JSON', async () => {
    const response = await request(createServer(container))
      .post('/users')
      .set('Content-Type', 'application/json')
      .send('{"username": ');

    expect(response.status).toEqual(400);
    expect(response.body.status).toEqual('fail');
    expect(response.body.message).toEqual('body request harus berupa JSON yang valid');
  });

  it('should handle server error correctly and hide error details', async () => {
    const brokenContainer = {
      getInstance: () => ({
        execute: () => { throw new Error('database meledak'); },
      }),
    };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(createServer(brokenContainer))
      .post('/users')
      .send({ username: 'dicoding', password: 'secret', fullname: 'Dicoding Indonesia' });

    expect(response.status).toEqual(500);
    expect(response.body).toEqual({
      status: 'error',
      message: 'terjadi kegagalan pada server kami',
    });
    expect(consoleError).toBeCalled();
    consoleError.mockRestore();
  });
});
