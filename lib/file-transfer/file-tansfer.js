let fs = require('fs');
let request = require('request');

request('https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1524259141203&di=473ea510a23851316ec30c320f81d3f2&imgtype=0&src=http%3A%2F%2Fe.hiphotos.baidu.com%2Fzhidao%2Fpic%2Fitem%2Faa18972bd40735fa621923d798510fb30e2408f6.jpg').pipe(fs.createWriteStream('test.jpg'))