let crypto = require('crypto');

module.exports = function (timestamp, uuid, name, method, sk) {
    let url = encodeURIComponent(name).toLocaleLowerCase();
    let signatureStr =
`${method}
${url}
x-jsb-sdk-req-timestamp:${timestamp}
x-jsb-sdk-req-uuid:${uuid}
`;
    let hexDigest = getHexDigest(signatureStr);
    let kReqid = getKReqid(sk, uuid);
    return getKsigning (hexDigest, kReqid);
};

function getHexDigest (str) {
    return crypto.createHash('sha1').update(Buffer.from(str, 'utf-8')).digest('hex');
}

function getKReqid(sk, uuid) {
    return crypto.createHmac('sha256', Buffer.from('JSB4' + sk, 'utf-8')).update(Buffer.from(uuid, 'utf-8')).digest();
}

function getKsigning (hexDigest, kSigning) {
    return crypto.createHmac('sha256', kSigning).update(Buffer.from(hexDigest, 'utf-8')).digest('hex');
}

