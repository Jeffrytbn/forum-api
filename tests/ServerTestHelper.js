const jwt = require('jsonwebtoken');
const UsersTableTestHelper = require('./UsersTableTestHelper');

const ServerTestHelper = {
  // Membuat user di database dan mengembalikan access token yang valid untuk user tersebut.
  async getAccessToken({ id = 'user-123', username = 'dicoding' } = {}) {
    await UsersTableTestHelper.addUser({ id, username });

    return jwt.sign({ id, username }, process.env.ACCESS_TOKEN_KEY);
  },
};

module.exports = ServerTestHelper;
