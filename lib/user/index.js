let crypto = require('crypto');

let err = {
    status: false
};

let successResult = {
    keyStatu: true
};

function encodePassword(user) {
    user.password = crypto.createHmac('sha256',user.password).update(user.password).digest('hex');
}

function encode (str) {
    return crypto.createHmac('sha256',str).update(str).digest('hex');
}

module.exports = class User {
  constructor(opts) {
      this.tableName = opts.tableName || 'user';
      this.query = opts.query;
  }

  async add(user) {
      user = JSON.parse(JSON.stringify(user));
      encodePassword(user);
      return await this.query.insert(this.tableName, user);
  }

  async exit (user) {
      user = JSON.parse(JSON.stringify(user));
      let result = await this.query.select('*', this.tableName, {username: user.username});
      return result.status && result.result && result.result.length > 0;
  }

  async getOne (user) {
      let result = await this.get(user);
      if (!result.status) return result;
      let retuenData = {
          status: result.status,
          result: {
              user: null
          }
      };
      if (result.result.users.length > 0) {
          retuenData.result.user = result.result.users[0];
          if (retuenData.result.user.password !== encode(user.password)) {
              return {status: false, message: 'password is incorrect', code: 'PASSWORD_INCORRECT'}
          }
      } else {
           return {status: false, message: 'user do not exit', code: 'USER_DO_NOT_EXIT'}
      }
      return retuenData;
  }

  async get(user) {
      user = JSON.parse(JSON.stringify(user));
      if (user.password) {
          encodePassword(user);
      }
      let result = await this.query.select('*', this.tableName, {username: user.username});
      result.status && (result = {
          status: result.status,
          result: {
              users: result.result
          }
      });
      return result;
  }

  async getOneById (id) {
      let result = await this.query.select('*', this.tableName, {id: id});
      result.status && (result = {
          status: result.status,
          result: {
              user: result.result[0]
          }
      });
      return result;
  }
};