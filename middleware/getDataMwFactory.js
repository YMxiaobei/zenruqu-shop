let config = require('../config');
let GetData = require('../helper/getData/getData');
let databaseQuery = require('../global').dataBaseQuery;

module.exports = function (type, name, sendToClient = true) {
    return async function (req, res) {
        let shopId = parseInt(req.query.shopId);
        let result = await databaseQuery.selectOne(['AK', 'SK'], 'taobaoShops', {id: shopId});
        if (!result.status) {
            return res.send(result);
        }
        let getData = new GetData();
        return getData.setSK(result.result.SK).setAK(result.result.AK).get(`${config.getDataBasePath}/${type}/${name}`,req.body)
               .then((data) => {
                   if (sendToClient) {
                       res.send(data);
                   }
                   return data;
               }, (err) => {
                   if (sendToClient) {
                       res.send(err);
                   }
                   return err;
               })
    }
};