require('dotenv').config();
const createServer = require('./Infrastructures/http/createServer');
const container = require('./Infrastructures/container/container');

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 5000;

const app = createServer(container);

app.listen(port, host, () => {
  console.log(`server start at http://${host}:${port}`);
});
