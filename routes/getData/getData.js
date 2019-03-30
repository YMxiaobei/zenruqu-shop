let express = require('express');
let router = express.Router();
let getSK = require('../../helper/getSK');

router.post('/', function (req, res, next) {
    req.query.sk = getSK(req.query.ak)
});

router.use('/getItemData', require('./getItemData'));
module.exports = router;