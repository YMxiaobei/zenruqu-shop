let url = require('url');
let initRequestHeader = require('../initRequstHeader');
let HttpProx = require('../../lib/httpProx/index');
let httpProx = new HttpProx();

class GetData {
   setSK (SK) {
       this._SK = SK;
       return this;
   }

   setAK (AK) {
       this._AK = AK;
       return this;
   }

   get (api, paramMap, headers = {}) {
       let urlStr = api + '?' + HttpProx.getQuery(paramMap);
       initRequestHeader(headers, this._AK, this._SK, urlStr);
       return httpProx.get(urlStr, {headers: headers});
   }
}

module.exports = GetData;