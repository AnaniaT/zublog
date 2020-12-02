const mongoose = require('mongoose');

let mongoRetries = 5;
const connect = () => {
  mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    })
    .catch(() => {
      if (mongoRetries > 0) {
        mongoRetries--;
        connect();
      }
    });
};

connect();
