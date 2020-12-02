const server = require('./app');

const port = process.env.PORT || 3000;
const host = '192.168.1.19';
server.listen(port, () => {
  console.log('Server running on port ' + port);
  // console.log("Server running on " + host + ":" + port);
});
