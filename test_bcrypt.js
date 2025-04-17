const bcrypt = require('bcrypt');

// hash ที่ต้องการตรวจสอบ
const hash = '$2b$10$hvKRCDjA5rdCtMUSLr3H5.aNyUGwSKUGqJ.g24V1ngcqTqnGeSITO';

// password ที่จะเทียบ
const passwordToTest = '123456';

bcrypt.compare(passwordToTest, hash).then(result => {
  console.log(`ผลลัพธ์: ${result ? '✅ ตรงกัน' : '❌ ไม่ตรงกัน'}`);
});