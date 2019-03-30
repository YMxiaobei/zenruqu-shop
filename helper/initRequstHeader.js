let uuidv1 = require('uuid/v1');

module.exports = function (headers, AK, SK, name) {
    let timestamp = Math.round(Date.now() / 1000);
    let uuid = uuidv1();
    let signature = require('./getSignature')(timestamp,uuid,name,"GET",SK);
    headers['x-jsb-sdk-req-timestamp'] = timestamp;
    headers['x-jsb-sdk-req-uuid'] = uuid;
    headers['Authorization'] = `Credential=${AK},SignedHeaders=x-jsb-sdk-req-timestamp;x-jsb-sdk-req-uuid,Signature=${signature}`;
};