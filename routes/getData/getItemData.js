let express = require('express');
let router = express.Router();

let apiMap = ['ItemsOnsaleGetRequest', 'ItemsInventoryGetRequest', 'ItemsSellerListGetRequest', 'ItemSellerGetRequest'];

for (let apiName of apiMap) {
    router.post(`/${apiName}`, require('../../middleware/getDataMwFactory')('item', apiName))
}

module.exports = router;
