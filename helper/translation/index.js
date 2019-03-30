let crypto = require('crypto');
let HttpProx = require('../../lib/httpProx/index');
let httpProx = new HttpProx();

// let md5=crypto.createHash("md5");
// md5.update("abcdef");
// let str=md5.digest('hex');

let e = module.exports;

let appid = '20180806000192176';//"67790969ae1c3766";
let secretKey = "jmzsPpUXDAJfLyh9km8G";//"94zzLrq4Ual5DgVHT0UDnGiYZn4jTlaT";
let api = "http://api.fanyi.baidu.com/api/trans/vip/translate";//"http://openapi.youdao.com/api";

function genarateSign (query) {
    let baseStr = query.appid + query.q + query.salt + secretKey;
    return crypto.createHash('md5').update(baseStr).digest('hex');
}

function encodeBody (query) {
    for (let key in query) {
        query[key] = encodeURIComponent(query[key]);
    }
}

async function translateCn (to, text) {
    let query = {
        from: "auto",
        to: to,
        salt: Math.round(Math.random() * 10000000000) + '',
        q: text,
        appid: appid
    };

    // query.q = query.q.replace(/\n/g, "%%");
    query.sign = genarateSign(query);
    // encodeBody(query);
    let returnData = await httpProx.get(api, {query: query});
    return JSON.parse(returnData);
}

e.cnToEn = async function (text) {
    return translateCn('en', text);
};

e.cnToCht = async function (text) {
    return translateCn('cht', text);
};
