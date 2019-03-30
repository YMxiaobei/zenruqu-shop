let express = require('express');
let router = express.Router();
let passport = require('passport');
let JwtStrategy = require('passport-jwt').Strategy;
let ExtractJwt = require('passport-jwt').ExtractJwt;
let userManager = require('../global').userManager;
let userMidlewares = require('../middleware/user');
let opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: require('../config').cryptoKey
};
let getData = require('./getData/getData');

passport.use(new JwtStrategy(opts, async function (payLoad, done) {
    let result = await userManager.getOneById(payLoad.id);
    if (result.status && result.result.user) {
        done(null, result.result.user);
    } else if (result.status) {
        done(result,false)
    } else {
        done(null, false)
    }
}));

router.use('/', passport.authenticate('jwt', {session: false}));
router.use('/getData', getData);
router.post('/shops/:operate', userMidlewares.shopOperate);
router.get('/info', userMidlewares.getUserInfo);
router.get('/products', userMidlewares.getProducts);
router.get('/products/detail', userMidlewares.getProductsDetail);
router.get('/products/synchronization', userMidlewares.synchronization);
router.get('/synchronizationCategories', userMidlewares.postDataMidleware('getCategories'), userMidlewares.synchronizationCategories);
router.post('/getAttributes', userMidlewares.postDataMidleware('getAttributes'), userMidlewares.getAttributes);
router.post('/logistics', userMidlewares.postDataMidleware('logistics'), userMidlewares.getLogistics);
router.get('/getCategories', userMidlewares.getCategories);
router.get('/getSubCategories', userMidlewares.getSubCategories);
router.post('/uploadImg', userMidlewares.uploadImg);
router.get('/getSiblingCategories', userMidlewares.getSiblingCategories);
router.post('/product/update', userMidlewares.updateProduct);
router.post('/products/update', userMidlewares.updateProducts);
router.post('/products/updateQuantity', userMidlewares.updateQuantitys);
router.post('/products/updatePrice', userMidlewares.updatePrices);
router.get('/products/getAllproductsId', userMidlewares.getAllProductIds);
router.post('/postSettiny', userMidlewares.postSetting);
router.post('/addItems', userMidlewares.addItems);
router.get('/getDefaulSetting', userMidlewares.getDefaultSetting);
router.post('/addAddrMap', userMidlewares.addAddrMap);
router.get('/getSuppliers', userMidlewares.getSupplier);
router.post('/translate', userMidlewares.translate);
router.get('/getAddrMap', userMidlewares.getAddrMap);
router.get('/getSupplierXlsx', userMidlewares.getSuppliersXlsx);

module.exports = router;
