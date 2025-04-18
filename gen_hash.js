const bcrypt = require('bcrypt');

const password = '789101';
bcrypt.hash(password, 10).then(hash => {
  console.log('✅ Hash ที่ได้:', hash);
});