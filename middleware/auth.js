let tokenGenerate = require('../lib/tokenGenerate');
let config = require('../config');
let User = new require('../lib/user');
let userManager = require('../global').userManager;

let e = module.exports = {};

e.login = async function (req, res) {
    let userOrErr = await userManager.getOne(req.body);
    if (userOrErr.status ) {
        delete userOrErr.result.user.password;
        userOrErr.result.token = tokenGenerate({id:userOrErr.result.user.id},config.cryptoKey);
        userOrErr.result = {
            token: userOrErr.result.token,
            user: userOrErr.result.user
        }
    }
    res.send(userOrErr);
};

e.register = async function (req, res) {
    if (await userManager.exit(req.body)) {
        res.send ({status: false, message: 'user already exit', code: 1})
    } else {
        let userOrErr = await userManager.add(req.body);
        if (userOrErr.status) {
            e.login(req, res);
        } else {
            res.send(userOrErr);
        }
    }
};

