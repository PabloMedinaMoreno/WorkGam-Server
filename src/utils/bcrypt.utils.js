import bcrypt from 'bcryptjs';

const plainPassword = '12345';
const hashedPassword = await bcrypt.hash(plainPassword, 10);
console.log(hashedPassword);