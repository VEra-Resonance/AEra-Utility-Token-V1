const UserService = require('./services/userService');

const userService = new UserService();

// Test 1: Get existing user
console.log('\n=== TEST 1: GET EXISTING USER ===');
const existingUser = userService.getUserByTelegramId(5122525349);
console.log('Existing User:', existingUser);

// Test 2: Try to register with DIFFERENT wallet
console.log('\n=== TEST 2: REGISTER WITH DIFFERENT WALLET ===');
const result2 = userService.registerUserWallet(5122525349, '0x1234567890abcdef1234567890abcdef12345678', 'test-session-2');
console.log('Result:', result2);

// Test 3: Try to register with SAME wallet
console.log('\n=== TEST 3: REGISTER WITH SAME WALLET ===');
const result3 = userService.registerUserWallet(5122525349, '0xfba43a53754886010e23549364fdb54a2c06cbfa', 'test-session-3');
console.log('Result:', result3);

userService.close();
