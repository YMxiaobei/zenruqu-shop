const e = module.exports = {};
const userManager = require('../global').userManager;
const databaseQuery = require('../global').dataBaseQuery;
const getDataMwFactory = require ('./getDataMwFactory');
const fields = ['num_iid', 'price', 'title', 'sku', 'pic_url','item_weight', 'item_img.url', 'desc', 'num', 'outer_id'];
const filtHTMLTapRegx = /<[^<]+>/g;
const util = require('../lib/util');
const crypto = require('crypto');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const translation = require('../helper/translation');
const config = require('../config');
const xlsx = require('node-xlsx');
const createProductsInfo = {
    title: 'VARCHAR(200)',
    id: 'INT NOT NULL AUTO_INCREMENT',
    item_imgs: 'TEXT',
    item_weight: 'VARCHAR(255)',
    newprepay: 'VARCHAR(255)',
    pic_url: 'VARCHAR(255)',
    num_iid: 'VARCHAR(255)',
    price: 'VARCHAR(255)',
    skus: 'TEXT',
    userId: 'INT(11)',
    originPrice: 'INT(11)',
    description: 'TEXT',
    categorieId: 'INT(11)',
    num: 'INT(11)',
    sku_id: 'VARCHAR(255)',
    outer_id: 'VARCHAR(255)',
    logistics: 'TEXT',
    attributes: 'VARCHAR(255)'
};

const shopTypeMap = {
    '1': 'taobaoShops',
    '2': 'tongbuShops'
};

const postDataApiMap = {
    'getCategories': 'https://partner.shopeemobile.com/api/v1/item/categories/get',
    'getAttributes': 'https://partner.shopeemobile.com/api/v1/item/attributes/get',
    'logistics': 'https://partner.shopeemobile.com/api/v1/logistics/channel/get',
    'addItem': 'https://partner.shopeemobile.com/api/v1/item/add'
};

const categoriesNameMap = [{category_name: '女生衣著'}, {category_name: '女生包包/精品'}, {category_name: '女生配件'}, {category_name: '女鞋'}, {category_name: '男生衣著'}];

let HttpProx = require('../lib/httpProx');
let httpProx = new HttpProx();
httpProx.enableHttps();

function createAddItemBody(products) {
    return products.map((item, index) => {
        let variations = JSON.parse(item.skus).sku.map(item => {
            return {
                name: item.properties_name,
                stock: parseInt(item.quantity),
                price: parseFloat(item.price),
                variation_sku: item.sku_id
            }
        });

        let images = JSON.parse(item.item_imgs).item_img;

        return {
            category_id: item.categorieId,
            name: item.title,
            description: item.description,
            price: parseFloat(item.price),
            stock: item.num,
            item_sku: item.sku_id,
            variations: variations,
            images: images,
            logistics: JSON.parse(item.logistics),
            weight: parseFloat(item.item_weight),
            attributes: JSON.parse(item.attributes)
        }
    });
}

function pass (map, item, filterName1, filterName2) {
    for (let i of map) {
        if (i[filterName2] === item[filterName1]) return true;
    }
    return false;
}

function pickNum_iid (originArr , startIndex, endIndex) {
    const arr = [];
    for (let i = startIndex, len = originArr.length; i <= endIndex && i < len; i++) {
        arr.push(originArr[i].num_iid);
    }
    return arr.join(',');
}

function dealSkus (skus, baseSku) {
    if (!skus || !skus.sku) return;
    skus.sku.forEach((item, index) => {
        const beforeDealNameArr  = item.properties_name.split(";");
        const afterDealNameArr = beforeDealNameArr.map(i => {
            return i.split(":").splice(3, 1).join(":");
        });
        item.properties_name = afterDealNameArr.join(';');
        item.sku_id = `${index}-`;
        item.originPrice = parseFloat(item.price);
    });
    skus.sku_id_record = skus.sku.length - 1;
}

async function translate (item, type) {
    let pros = [];
    pros.push(translation[type](item.title).then(translateResult => {
        if (translateResult.trans_result && translateResult.trans_result.length ) {
            let dsts = translateResult.trans_result.map(it => it.dst);
            item.title = dsts.join('\n');
        }
    }));
    pros.push(translation[type](item.description).then(translateResult =>{
        if (translateResult.trans_result && translateResult.trans_result.length ) {
            let dsts = translateResult.trans_result.map(it => it.dst);
            item.description = dsts.join('\n');
        }
    }));
    let skus = JSON.parse(item.skus).sku;
    for (let sku of skus) {
        pros.push(translation[type](sku.properties_name).then(translateResult => {
            if (translateResult.trans_result && translateResult.trans_result.length) {
                let dsts = translateResult.trans_result.map(it => it.dst);
                sku.properties_name = dsts.join('\n');
            }

        }));
    }
    await Promise.all(pros);
    item.skus = JSON.stringify({sku: skus});
    return item;
}

async function pickSupplier (item, userId) {
   let supplier = {sku_id: item.sku_id, userId: userId};

   if (!(await pickSupplierRule1(item, supplier, userId))) {
       await pickSupplierRule2(item, supplier, userId);
   }
   const updateResult = await databaseQuery.update('suppliers', supplier, {sku_id: item.sku_id});
}

async function pickSupplierRule1 (item, supplier, userId) {
    let arr = item.outer_id.split("_");
    if (arr.length !== 5) {
        return false;
    }


    supplier.addr = `${arr[1]} ${arr[2]}`;
    supplier.price = arr[3].substr(1);
    supplier.num = arr[4].substr(1);

    let testRegex = /[0-9a-zA-Z]+/;
    let index;
    for (let i = 0, len = arr[1].length; i < len; i++) {
        if (testRegex.test(arr[1].charAt(i))) {
            index = i;
            break;
        }
    }

    key = arr[1].substr(0, index);
    let selectResult = await databaseQuery.selectOne('abbreviation', 'supplier_addr_maps', {addr: key, userId: userId});
    if (selectResult.status) {
        supplier.abbreviation = selectResult.result && selectResult.result.abbreviation || "";
    } else {
        supplier.abbreviation = "";
    }


    if (item.skus && item.skus.sku) {
        console.log(1111111);
        item.skus.sku.forEach(item => item.sku_id = `${item.sku_id} ${supplier.addr} ${supplier.num}`);
    }
    return true;
}

async function pickSupplierRule2 (item, supplier, userId) {
    let arr1 = item.outer_id.split("-");
    arr2 = arr1.slice(0, arr1.length - 1);
    supplier.addr = arr2.join("-");
    supplier.price = arr1[arr1.length - 1].split("#")[0];
    supplier.num = arr1[arr1.length - 1].split("#")[1];
    let key = arr1[0].split(" ")[0];
    let selectResult = await databaseQuery.selectOne('abbreviation', 'supplier_addr_maps', {addr: key, userId: userId});
    if (selectResult.status) {
        supplier.abbreviation = selectResult.result && selectResult.result.abbreviation || "";
    } else {
        supplier.abbreviation = "";
    }


    if (item.skus && item.skus.sku) {
        console.log(2222222);
        item.skus.sku.forEach(item => item.sku_id = `${item.sku_id} ${supplier.addr} ${supplier.num}`);
    }
}

e.getSuppliersXlsx = async function (req, res, next) {
    try {
        let rows = (await databaseQuery.select('sku_id,num,addr,price', 'suppliers', {userId: req.user.id})).result;
        let data = [['ITEM SKU', '货号', '供应商地址', '进货价(元)']];
        for (let row of rows) {
            let arr = [];
            for(let key in row) {
                arr.push(row[key]);
            }
            data.push(arr);
        }

        console.log (data.length);

        const buffer = xlsx.build([{name:'suppliers', data: data}]);
        fs.writeFile('./public/xlsx/result.xls', buffer, function (err)
            {
                if (err) {
                    res.send ({status: false, message: err});
                } else {
                    res.send({status: true, url: 'http://localhost:3000/public/xlsx/result.xls'});
                }
            }
        );

    } catch (e) {
        res.send({status: false, message: e});
    }
};

e.addAddrMap = async function (req, res) {
    req.body.userId = req.user.id;
    const updateResult = await databaseQuery.update('supplier_addr_maps', req.body, {userId: req.user.id, addr: req.body.addr});
    res.send(updateResult);
};

e.getAddrMap = async function (req, res) {
    let selectResult = await databaseQuery.select("*", 'supplier_addr_maps', {userId: req.user.id});
    res.send(selectResult);
};

e.shopOperate = async function(req, res) {
    let operate = req.params.operate;
    let shopTable = shopTypeMap[req.query.shopType];

    if (!shopTable) return res.send({
        status: false,
        message: 'shopType error'
    });

    switch (operate) {
        case 'add': {
            let isExit = await databaseQuery.exit(shopTable, {name: req.body.name});
            if (isExit) {
                return res.send({status: false, message: 'name already exit'})
            }
            req.body.userId = req.user.id;
            let result = await databaseQuery.insert(shopTable, req.body);
            if (result.status) {
                res.send ({status: true, result: 'success'});
            } else {
                res.send(result);
            }
            break;
        } case 'get': {
            let filter = {userId: req.user.id};
            let result = await databaseQuery.select(['id','name'], shopTable, filter);
            res.send(result);
        }
    }
};

e.getProducts  = async function (req, res, next, sendToClient = true, recursionData = {page_no: 1, page_size: 200, result: []}) {
    req.body = {
        fields:'num_iid',
        page_no: recursionData.page_no,
        page_size: recursionData.page_size
    };
    const getProductsFn = getDataMwFactory('item', 'ItemsOnsaleGetRequest', false);
    let returnData = await getProductsFn(req, res);
    if (!returnData) {
        return await e.getProducts(req, res, next, sendToClient, recursionData);
    } else {
        try {
            returnData = JSON.parse(returnData);
            if (returnData.items_onsale_get_response && returnData.items_onsale_get_response.items) {
                recursionData.result = recursionData.result.concat(returnData.items_onsale_get_response.items.item, recursionData.result);
                if (returnData.items_onsale_get_response.total_results > recursionData.page_no * recursionData.page_size) {
                    recursionData.page_no ++;
                    return await e.getProducts(req, res, next, sendToClient, recursionData);
                } else {
                    returnData = {
                        status: true,
                        result: recursionData.result
                    }
                }
            } else {
                returnData = {
                    status: false,
                    message: 'something wrong'
                }
            }
        } catch (e) {
            returnData = {
                status: false,
                message: e
            };
        }

        sendToClient && res.send(returnData);
        return returnData;
    }
};

e.getSupplier = async function (req, res) {
    const  selectResult = await databaseQuery.select('*', "suppliers", {userId: req.user.id});
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    if (selectResult.status) {
        selectResult.length = selectResult.result.length;
        selectResult.result = selectResult.result.slice(limit * (page - 1), limit * page);
    }
    res.send(res.send(selectResult));
};

e.translate = async function (req, res) {
    let itemIds = req.body.itemIds;
    let filter = itemIds.map(id => {
        return {id: id}
    });
    let pros = [];
    let newItems = [];
    let selectResult = await databaseQuery.select("*", "products" + req.user.id, filter);
    if (selectResult.status) {
        selectResult.result.forEach(item => {
            pros.push(translate(item, req.body.type).then(newItem => {
                newItems.push(newItem);
            }));
        });
        await Promise.all(pros);
        let udpatePros = [];
        for (let newItem of newItems) {
            // let result = await databaseQuery.update('products', newItem, {id:newItem.id});
            // console.log(result.result, newItem.title);
            udpatePros.push(databaseQuery.update('products' + req.user.id, newItem, {id:newItem.id}));
        }
        await Promise.all(udpatePros);
        res.send({status: 'success'});
    }
};

e.synchronization = async function (req, res) {
    await databaseQuery.dropTable('products' + req.user.id);
    let products;
    products = await e.getProducts(req, res, null, false);

    if (!products.status) return res.send (products);

    let startIndex = 0;
    let endIndex = 19;
    let resultArr = [];
    let returnData = {};
    req.body = {
        fields: fields.join(',')
    };
    const getProductsFn = getDataMwFactory('item', 'ItemsSellerListGetRequest', false);
    let count = 0;

    async function getDetails () {
        count ++;
        console.log (count, '====counttttttttt');
        req.body.num_iids = pickNum_iid(products.result, startIndex, endIndex);
        let data = await getProductsFn(req, res);
        try {
            if (!data) {
                return await getDetails();
            }
            data = JSON.parse(data);
            if (data.items_seller_list_get_response && data.items_seller_list_get_response.items) {
                resultArr = resultArr.concat(data.items_seller_list_get_response.items.item);
                if (endIndex < products.result.length - 1) {
                    startIndex += 20;
                    endIndex += 20;
                    await getDetails ();
                } else {
                    returnData = {
                        status: true,
                        result: resultArr
                    }
                }
            } else {
                returnData = {status: false, message: 'something wrong man'}
            }
        }catch (e) {
            returnData = {status: false, message: 'is me'}
        }
        return data;
    }

    await getDetails ();

    if (returnData.status) {
        let selectResult = await databaseQuery.selectOne('setting', 'taobaoShops', {id: req.query.shopId});
        let setting;
        if (selectResult.status && selectResult.result) {
            if (selectResult.result.setting === 'undefined') return;
            if (selectResult.result.setting) {
                setting = JSON.parse(selectResult.result.setting);
                setting.desc = decodeURIComponent(setting.desc);
            }
        }
        for (let i = 0, len = returnData.result.length; i < len; i++) {
            let item = returnData.result[i];
            dealSkus(item.skus, item.num_iid);
            item.num_iid = item.num_iid.toString();
            item.sku_id = item.num_iid;
            item.userId = req.user.id;
            let desc = item.desc.replace(filtHTMLTapRegx, "").replace(/\&nbsp;/g, '');
            delete item.desc;
            item.description = desc;
            item.originPrice = parseFloat(item.price);
            let setPrice = false;
            if (setting) {
                item.item_weight = setting.weight || item.item_weight;
                if (setting.freight && setting.profit && setting.exchangeRate && setting.discount) {
                    setPrice = true;
                }
                setPrice && (item.price = (item.originPrice + setting.freight + setting.profit) * setting.exchangeRate / setting.discount);
                item.description = item.description + setting.desc;
                setting.logistics && (item.logistics = setting.logistics);
            }
            !item.skus && (item.skus = {sku:[]});
            item.skus.sku.forEach (item => {
                item.quantity = setting && (setting.quantity || setting.quantity === 0) ? setting.quantity : item.quantity;
                setPrice && (item.price = (item.originPrice + setting.freight + setting.profit) * setting.exchangeRate / setting.discount) || (item.price = parseFloat(item.price));
            });
            await pickSupplier(item, req.user.id);
        }
        let insertResult = await databaseQuery.insert('products' + req.user.id, returnData.result, null, createProductsInfo);
        if (!insertResult.status) {
            returnData = insertResult;
        } else {
            const selectResult = await databaseQuery.select("*", 'products' + req.user.id);
            if (selectResult.status) {
                selectResult.result = selectResult.result.splice(0, 40);
                selectResult.result.forEach (item => {
                    item.skus && (item.skus = JSON.parse(item.skus));
                    item.item_imgs && (item.item_imgs = JSON.parse(item.item_imgs));
                    item.attributes && (item.attributes = JSON.parse(item.attributes));
                    typeof item.category_names === 'string' && (item.category_names = JSON.parse(item.category_names));
                });
            }
            returnData = selectResult;
        }
    }
    res.send(returnData);
};

e.getProductsDetail = async function (req, res) {
    const selectResult = await databaseQuery.select("*", "products" + req.user.id, {userId: req.user.id});
    let returnData;
    if (selectResult.status) {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        selectResult.result.forEach (item => {
            item.skus && (item.skus = JSON.parse(item.skus));
            item.item_imgs && (item.item_imgs = JSON.parse(item.item_imgs));
            item.attributes && (item.attributes = JSON.parse(item.attributes));
            typeof item.category_names === 'string' && (item.category_names = JSON.parse(item.category_names));
        });
        returnData = {
            status: true,
            result: selectResult.result.slice((page - 1) * limit, (page - 1) * limit + limit),
            totalResults: selectResult.result.length
        }
    } else {
        returnData = selectResult;
    }
    res.send(returnData);
};

e.getUserInfo = async function (req, res) {
    const user = await databaseQuery.selectOne("id,username", 'user', {id:req.user.id});
    res.send(user);
};

e.postDataMidleware = function (postDataApi, sendToClient = false) {
    return async function (req, res, next) {
        let shopInfo = await databaseQuery.selectOne ('*', 'tongbuShops',  {id: parseInt(req.query.shopId)});
        if (shopInfo.status) {
            let body = util.extendObj({
                shopid: parseInt(shopInfo.result.shopId),
                partner_id: parseInt(shopInfo.result.partnerId),
                timestamp: Math.round(Date.now() / 1000)
            }, req.body) ;
            let baseString = `${postDataApiMap[postDataApi]}|${JSON.stringify(body)}`;
            let authorization = crypto.createHmac('sha256', shopInfo.result.secretKey).update(baseString).digest('hex');
            let opts = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorization
                },
                body: body
            };

            let data = await httpProx.post(postDataApiMap[postDataApi], opts);
            typeof data === "string" && (data = JSON.parse(data));
            req.data = data;
        } else {
            req.data = shopInfo;
        }

        if (sendToClient) {
            res.send(req.data);
        } else {
            next && next();
            return req.data
        }
    }
};

e.synchronizationCategories = async function (req, res) {
    await databaseQuery.dropTable('categories');
    data = req.data;

    let insertResult = await databaseQuery.insert('categories', data.categories);
    if (insertResult.status) {
        returnData = {
            status: true,
            result: data.categories
        };
    } else {
        returnData = insertResult
    }

    // if (!data.categories) return res.send(data);
    //
    // let returnData;
    // let categories = [];
    // let categoriesTemp;
    // let map = categoriesNameMap;
    // let filterName1 = 'category_name';
    // let filterName2 = 'category_name';
    //
    // function filtCategories () {
    //     categoriesTemp = data.categories.filter (item => {
    //         let isPass = pass(map, item, filterName1, filterName2);
    //         if (isPass) {
    //             categories.push(item);
    //         }
    //         return isPass;
    //     });
    //     filterName1 = 'parent_id';
    //     filterName2 = "category_id";
    //     if (categoriesTemp.length) {
    //         map = categoriesTemp;
    //         categoriesTemp.length && filtCategories ();
    //     }
    // }
    //
    // filtCategories();
    //
    // if (categories.length) {
    //     let insertResult = await databaseQuery.insert('categories', categories);
    //     if (insertResult.status) {
    //         returnData = {
    //             status: true,
    //             result: categories
    //         };
    //     } else {
    //         returnData = insertResult
    //     }
    // } else {
    //     returnData = {
    //         status: false,
    //         message: 'get categories from shopee fail'
    //     }
    // }

    res.send (returnData);
};

e.getCategories = async function (req, res) {
    if (req.query.synchronization === 'false') {
        let selectResult = await databaseQuery.select('*', 'categories', {parent_id:0});
        res.send(selectResult);
    } else {
        let returnData = await e.postDataMidleware('getCategories')(req, res);
        if (returnData.categories) {
            e.synchronizationCategories(req, res);
        }
    }

    // if (!selectResult.status && selectResult.code === 'ER_NO_SUCH_TABLE') {
    //
    // } else {
    //     res.send(selectResult);
    // }
};

e.updateProduct = async function (req, res) {
    let item = req.body;
    item.skus && (item.skus = JSON.stringify(item.skus));
    item.item_imgs && (item.item_imgs = JSON.stringify(item.item_imgs));
    let updateResult = await databaseQuery.update('products' + req.user.id, item, {id: item.id});
    if (!updateResult.status) return res.send({status: false, message: 'error occur when updating products'});
    res.send({status: true, message: 'success'});
};

e.updateProducts = async function (req, res) {
    let productIds = req.body.productIds.map(i => {
        return {id: i}
    });
    delete req.body.product.id;
    let updateResult = await databaseQuery.update('products' + req.user.id, req.body.product, productIds);
    if (updateResult.status) return res.send({status: true, message: 'success'});
    res.send(updateResult);
};

e.updateQuantitys = async function (req, res) {
    let productIds = req.body.productIds.map(i => {
        return {id: i}
    });
  let selectReuslt = await databaseQuery.select('skus,id', 'products' + req.user.id, productIds);
  let errArr = [];
  let pros = [];
  if (selectReuslt.status) {
      selectReuslt.result.forEach(item => {
          let skus = JSON.parse(item.skus);
          skus.sku.forEach(sku => sku.quantity = req.body.product.quantity);
          pros.push(databaseQuery.update('products' + req.user.id, {skus: JSON.stringify(skus)}, {id: item.id}).then(result => !result.status && errArr.push(result)));
      })
  }
  await Promise.all(pros);
  if (!errArr.length) {
      return res.send({status: true, message: 'success'})
  }
  res.send({status: false, result: errArr});
};

e.updatePrices = async function (req, res) {
    let productIds = req.body.productIds.map(i => {
        return {id: i}
    });
    let selectReuslt = await databaseQuery.select('skus,id, originPrice', 'products' + req.user.id, productIds);
    let errArr = [];
    let pros = [];
    if (selectReuslt.status) {
        selectReuslt.result.forEach(item => {
            let product = req.body.product;
            let skus = JSON.parse(item.skus);
            skus.sku.forEach(item => {
                item.price = product.price || (item.originPrice + parseFloat(product.freight) + parseFloat(product.profit)) * parseFloat(product.exchangeRate) / parseFloat(product.discount);
            });
            pros.push(databaseQuery.update('products' + req.user.id, {
                skus: JSON.stringify(skus),
                price: product.price || (item.originPrice + parseFloat(product.freight) + parseFloat(product.profit)) * parseFloat(product.exchangeRate) / parseFloat(product.discount)
            }, {id: item.id}).then(result => !result.status && errArr.push(result)));
        })
    }
    await Promise.all(pros);
    if (!errArr.length) {
        return res.send({status: true, message: 'success'});
    }
    res.send({status: false, result: errArr});
};

e.getAllProductIds = async function (req, res) {
    let selectResult = await databaseQuery.select('id', 'products' + req.user.id);
    if (selectResult.status) {
        selectResult.result = selectResult.result.map(item => item.id);
    }
    res.send(selectResult);
};

e.uploadImg = async function (req, res) {
    let imgData = req.body.imgData;
    //过滤data:URL
    let type = imgData.substr(11, imgData.search(/;base64,/) - 11);
    let base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
    let dataBuffer = new Buffer(base64Data, 'base64');
    let path = `public/images/${uuidv1()}.${type}`;
    fs.writeFile(path, dataBuffer, function(err) {
        if(err){
            res.send(err);
        }else{
            res.send({status: true, result: `http://${config.host}:${config.port}/${path}`});
        }
    });
};

e.getSubCategories = async function (req, res) {
    res.send(await databaseQuery.select('*', 'categories', {parent_id: parseInt(req.query.parentId)}));
};

e.postSetting = async function (req, res) {
  let setting = req.body;
  let insertData = {
        freight: parseFloat(setting.freight),
        profit: parseFloat(setting.freight),
        exchangeRate: parseFloat(setting.exchangeRate),
        discount: parseFloat(setting.discount),
        quantity: setting.quantity,
        weight: setting.weight,
        desc: encodeURIComponent(setting.desc),
        logistics: setting.logistics
  };

  const updateResult = await databaseQuery.update('taobaoShops', {setting: insertData}, {id: req.query.shopId});
  if (updateResult.status) {
      res.send({status: true, message: "success"});
  } else {
      res.send (updateResult);
  }
};

e.getDefaultSetting = async function (req, res) {
    const selectResult = await databaseQuery.selectOne('setting', 'taobaoShops', {id: req.query.shopId});
    let returndata;
    if (selectResult.status ) {
        if (selectResult.result.setting) {
            returndata = {
                status: true,
                result: JSON.parse(selectResult.result.setting)
            };
            returndata.result.desc = decodeURIComponent(returndata.result.desc);
        } else {
            returndata = {
                status: true,
                result: {}
            }
        }
    } else {
        returndata = selectResult;
    }

    res.send(returndata);
};

e.getSiblingCategories = async function (req, res) {
  const category_id = parseInt(req.query.id);
  const selectResult = await databaseQuery.selectOne('*', 'categories', {category_id: category_id});
  if (selectResult.status) {
      const selectResult2 = await databaseQuery.select("*", 'categories', {parent_id: selectResult.result.parent_id});
      if (selectResult2.status) {
          res.send({
              status: true,
              result: {
                  categories: selectResult2.result,
                  activeId: category_id
              }
          })
      } else {
          res.send(selectResult2);
      }
  } else {
      res.send (selectResult);
  }
};

e.getAttributes = async function (req, res) {
    if (req.data && req.data.attributes) {
        req.data.attributes.forEach(item => {
            if (item.attribute_name === "品牌") {
                item.options = ['自有品牌'];
            }
        });
        res.send ({status: true, result: req.data.attributes});
    } else {
        res.send ({status: false, message: 'get attributes fail'})
    }
};

e.getLogistics = async function (req, res) {
    res.send ({result: req.data, status: true});
};

e.addItems = async function (req, res) {
    let addItem = e.postDataMidleware('addItem');
    let productIds = req.body.productIds.map(i => {
        return {id: i}
    });
    let selectResult = await databaseQuery.select('*', 'products' + req.user.id, productIds);
    let pros = [];
    let arr = [];
    if (selectResult.status) {
        let addItemDatas = createAddItemBody(selectResult.result);

        addItemDatas.forEach(item => {
            let body = {body: item, query: req.query};
            pros.push( addItem (body).then(data => {
                if (body.data && body.data.error) {
                    body.data.sku_id = item.item_sku;
                    arr.push(body.data);
                }
            }))
        });
        await Promise.all(pros);
        res.send({status: true, result: arr});
    } else {
        res.send({status: false, result: selectResult});
    }
};

e.getSetting = async function () {

};




