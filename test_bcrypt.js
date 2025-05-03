const bcrypt = require('bcrypt');

// hash ที่ต้องการตรวจสอบ
const hash = '$2b$10$51/V2ojZAgmB3LI.g4ICwO2PCoBhFXK5s5gRYPHepcYwRMEX9e.Hq';

// password ที่จะเทียบ
const passwordToTest = '654321';

bcrypt.compare(passwordToTest, hash).then(result => {
  console.log(`ผลลัพธ์: ${result ? '✅ ตรงกัน' : '❌ ไม่ตรงกัน'}`);
});