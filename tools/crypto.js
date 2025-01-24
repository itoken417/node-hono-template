import crypto from 'crypto';
import util from 'util';

var cipers = crypto.getCiphers();
console.log(util.inspect(cipers, { maxArrayLength: null }));

var hashes = crypto.getHashes();

console.log(hashes);
