const bcrypt = require('bcrypt');

// hash ที่ต้องการตรวจสอบ
const hash = '$2b$10$f.vhDd34X04BMQozNA2BV.rn0qY7KqA0wvxLPUQB2jUcK9IqUg4K2';

// password ที่จะเทียบ
const passwordToTest = '789101';

bcrypt.compare(passwordToTest, hash).then(result => {
  console.log(`ผลลัพธ์: ${result ? '✅ ตรงกัน' : '❌ ไม่ตรงกัน'}`);
});