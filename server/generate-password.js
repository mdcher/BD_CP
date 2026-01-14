const bcrypt = require('bcryptjs');

const password = 'password123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nTo update database, run:');
console.log(`UPDATE users SET password_hash = '${hash}' WHERE contactinfo LIKE '%@mail.com';`);
