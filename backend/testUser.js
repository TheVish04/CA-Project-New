const userModule = require('./models/User');
console.log('Raw module export:', userModule);
const User = require('./models/User'); // Changed from const { User } = require('./models/User');
console.log('User model:', User);
if (User && typeof User.findOne === 'function') {
  console.log('User.findOne is available');
} else {
  console.log('User.findOne is not available');
}
process.exit();