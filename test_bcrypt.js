const bcrypt = require('bcrypt');

// hash ที่ต้องการตรวจสอบ
const hash = '$2b$10$jV1ncempBojJdPUOqEMBkeaO1wrtS14pL6KqTq0DZrhbKv/97FSoO';

// password ที่จะเทียบ
const passwordToTest = '654321';

bcrypt.compare(passwordToTest, hash).then(result => {
  console.log(`ผลลัพธ์: ${result ? '✅ ตรงกัน' : '❌ ไม่ตรงกัน'}`);
});