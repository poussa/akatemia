var moment = require('moment-timezone');

moment.tz.load(require('./latest.json'));
console.log(moment.tz.names())