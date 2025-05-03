const bcrypt = require('bcrypt');

const password = '654321';
bcrypt.hash(password, 10).then(hash => {
  console.log('✅ Hash ที่ได้:', hash);
});