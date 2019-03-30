let http = require('http');
let https = require('https');
let Url = require('url');
let util = require('../util/index');
let initHeaders = require('../../helper/initRequstHeader');

function getOptions (url, opts) {
    let urlObj = Url.parse(opts.setPath ? this._path + url : url, true);
    util.extendObj(urlObj.query, opts.query);
    if (opts.urlParam instanceof Array) {
        urlObj.pathname =`${urlObj.pathname}/${opts.urlParam.join('/')}`;
    } else if (typeof opts.urlParam === 'string') {
        urlObj.pathname += ('/' + opts.urlParam)
    }

    let path = Url.parse(Url.format(urlObj)).path;

    return {
        method: opts.method,
        port: urlObj.port,
        hostname: urlObj.hostname,
        headers: opts.headers,
        path: path
    }
}

function getQuery(queryObj) {
    if( !queryObj || typeof queryObj !== 'object' ) return '';
    let queryArr = [];
    for (let key in queryObj) {
        if (queryObj[key] instanceof Array) {
            let arr = queryObj[key];
            for (let value of arr) {
                queryArr.push(`${key}=${value}`);
            }
        } else {
            queryArr.push(`${key}=${queryObj[key]}`);
        }
    }
    return queryArr.join('&');
}

class Index {
    constructor () {
        this.http = http;
        this._opts = {};
    }

    enableHttps() {
        this.http = https;
    }

    setOpts (newOpts) {
        this._opts = newOpts;
    }

    setOptsProperty(keyName, newValue) {
        this._opts[keyName] = newValue;
    }

    setPath(path) {
        this._path = path;
    };

    get (url, opts = this._opts, omitOptions = false) {
        if(omitOptions) opts = {};
        opts.method = 'GET';
        let options = getOptions(url, opts);
        let resolver, rejecter;
        let pro = new Promise((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
        });
        let request = this.http.request(options, (res) => {
            let returnData = '';
            res.on('data', (chunk) => {
                returnData += chunk
            });
            res.on('error', (e) => {
                rejecter(e);
            });
            res.on('end', () => {
                resolver(returnData);
            })
        });
        request.end();
        return pro;
    }

    post (url, opts = this._opts, omitOptions = false) {
        if(omitOptions) opts = {};
        opts.method = "POST";
        let options = getOptions(url, opts);
        let resolver, rejecter;
        let pro = new Promise((resolve, reject) => {
            resolver = resolve;
            rejecter = reject;
        });


        try {
            let request = this.http.request(options, (res) => {
                let returnData = '';
                res.on('data', (chunk) => {
                    returnData += chunk;
                });
                res.on('error', (e) => {
                    resolver(e);
                });
                res.on('end', () => {
                    resolver(returnData);
                })
            });
            request.write(JSON.stringify(opts.body));
            request.end();
        } catch (err) {
            resolver(JSON.stringify({status: false}));
        }
        return pro;
    }
}

Index.getQuery = getQuery;

module.exports = Index;

