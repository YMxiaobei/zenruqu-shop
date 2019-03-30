let base64url = require('base64url');
let crypto = require('crypto');

module.exports = function (user, key) {
    let head = base64url.encode(JSON.stringify({alg: "HS256", typ: "JWT"}));
    let pay_load = base64url.encode(JSON.stringify(user));
    let signature = crypto.createHmac('sha256', key).update(`${head}.${pay_load}`).digest('base64');
    signature = base64url.fromBase64(signature);
    return `${head}.${pay_load}.${signature}`;
};