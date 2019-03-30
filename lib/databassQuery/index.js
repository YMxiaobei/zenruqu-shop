
let mysql = require("mysql2/promise");
let util = require('../util');

let map = {
    min: '>=',
    max: '<=',
    greater: '>',
    lower: '<'
};

function fail(err) {
    err.status = false;
    return err;
}

function dealStr (str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function success(result) {
    return {result:result,status:true};
}

function createTableInfo (obj, opt) {
    if (obj instanceof Array) {
        obj = obj[0];
    }

    let tableInfo = {};
    opt && opt.defaultPrimaryKey && (tableInfo[opt.defaultPrimaryKey] = "INT NOT NULL AUTO_INCREMENT");
    for (let k in obj) {
        let type = typeof obj[k];
        if (type === 'string') {
            tableInfo[k] = `VARCHAR(${opt && opt.defaultStringLen || 200})`
        } else if (type === 'number') {
            tableInfo[k] = `INT(${opt && opt.defaultNumberLen})`
        } else if (type === 'boolean') {
            tableInfo[k] = 'BOOLEAN';
        }
    }

    return tableInfo;
}

function createFilterStr(filter) {
    let ands = [];
    let arr = [];
    let filters;
    if (filter instanceof Array) {
        filters = filter;
    } else {
        filters = [filter];
    }

    for (let filter of filters) {
        arr = [];
        for (let key in filter) {
            let value = filter[key];
            if (typeof value === 'object') {
                let arr2 = [];
                for (let key2 in value) {
                    arr2.push(`${key}${map[key2]}${value[key2]}`);
                }
                arr.push(arr2.join(' AND '));
            } else {
                arr.push(`${key}=${typeof value === "string" ? `'${dealStr(value)}'` : value}`);
            }
        }
        ands.push(`(${arr.join(' AND ')})`);
    }

    return ` WHERE ${ands.join(' OR ')}`;
}

class DatabaseQuery {
    constructor (opts) {
        this.opts = opts;
        this.defaultPrimaryKey = 'id';
        this.defaultStringLen = '200';
        this.defaultNumberLen = 11;
    }

    select (indexName, tableName, filter) {
        if (indexName instanceof Array ) indexName = indexName.join(',');
        let filterStr = '';

        if (filter) {
            filterStr = createFilterStr(filter);
        }

        let queryStr = `SELECT ${indexName} FROM ${tableName}${filterStr}`;
        console.log (queryStr);
        return this._connection.query(queryStr).then((result) => success(result[0]), err => fail(err));
    }

    selectOne (indexName, tableName, filter) {
        return this.select(indexName, tableName, filter).then (result => {
            if (result.status) {
                return {
                    status: true,
                    result: result.result[0]
                }
            } else {
                return result;
            }

        }, err => fail(err));
    }

    addColumnIfNotExit (err, data, table) {
        let name = err.message.split(' ')[2].replace(/'/g, '');
        let obj = {};
        obj[name] = data[name];
        let str = createTableInfo(obj);
        return this.addColumns(table, str);
    }

    createDatabase (database) {
        return this._connection.query(`create database ${database}`).then(result => success(result), err => fail(err));
    }

    createTable (tableName, tableInfo, key) {
        if (!tableInfo) {
            return {message: 'tableInfo cannot be null or undefind'};
        }

        let arr = [];
        let keyB;
        for (let k in tableInfo) {
            !keyB && (keyB = k);
            let value = typeof tableInfo[k] === 'string' ? tableInfo[k] : tableInfo[k].join(' ');
            arr.push (`${k} ${value}`);
        }
        let queryStr = `CREATE TABLE IF NOT EXISTS ${tableName}(${arr.join(',')},PRIMARY KEY ( ${key || keyB} ))ENGINE=InnoDB DEFAULT CHARSET=utf8;`;
        return this._connection.query(queryStr).then(result => success(result), err =>{
            return fail(err);
        });
    }

    addColumns (table, columns) {
        let arr = [];
        for (let name in columns) {
            arr.push(`${name} ${columns[name]}`);
        }
        let queryStr = `alter table ${table} add column ${arr.join(',')};`;
        return this._connection.query(queryStr).then(result => success(result), err => fail(err));
    }

    delete (table, filter) {
        let filterStr = createFilterStr(filter);
        let queryStr = `DELETE FROM ${table}${filterStr}`;
        return this._connection.query(queryStr).then(result => success(result), err => fail(err));
    }

    dropTable (tableName) {
        return this._connection.query(`DROP TABLE ${tableName}`).then(result => success(result), err => fail(err));
    }

    insert (table, insertData, columes, createTableInfoObj) {
        let createNew = false;
        let dataArr = [];
        let strArr = [];
        if (insertData instanceof Array) {
            dataArr = insertData
        } else {
            dataArr.push(insertData)
        }

        let keyArr = columes || [];

        if (!keyArr.length) {
            dataArr.forEach( item => {
                let valueArr = [];
                for (let k in item) {
                    keyArr.push(k);
                }
            });
            keyArr = Array.from(new Set(keyArr));
        }

        dataArr.forEach( item => {
            let valueArr = [];
            for (let k of keyArr) {
                item[k] === undefined && (item[k] = null);
                typeof item[k] === 'object' && (item[k] = JSON.stringify(item[k]));
                valueArr.push(`${typeof item[k] === 'string' ? `'${dealStr(item[k])}'` : item[k]}`);
            }
            strArr.push(`(${valueArr.join(',')})`)
        });

        let queryStr = `INSERT INTO ${table} (${keyArr.join(',')}) VALUES ${strArr.join(',')}`;
        return this._connection.query(queryStr).then(result => {
            return result;
        }, err => {
            if (err.code === 'ER_NO_SUCH_TABLE') {
                let tableInfo = createTableInfoObj || createTableInfo (insertData, {
                    defaultPrimaryKey: this.defaultPrimaryKey,
                    defaultNumberLen: this.defaultNumberLen,
                    defaultStringLen: this.defaultStringLen});
                createNew = true;
                return this.createTable(table,tableInfo,this.defaultPrimaryKey);
            }
            else if (err.code === 'ER_BAD_FIELD_ERROR') {
                // let name = err.message.split(' ')[2].replace(/'/g, '');
                // let obj = {};
                // obj[name] = insertData[name];
                // let str = createTableInfo(obj);
                // createNew = true;
                // return this.addColumns(table, str);
                createNew = true;
                return this.addColumnIfNotExit(err,insertData,table);
            }
            return Promise.reject(err);
        }).then(result => {
            if (createNew && result.status) {
                return this.insert(table, insertData);
            }
            return success(result);
        }, err => fail(err))
    }

    exit (table, filter) {
        return this.select("*", table, filter).then(result => {
            return result.status && result.result.length > 0;
        }, err => {
            return false;
        });
    }

    update (table, target, filter) {
        let tarStrArr = [];
        let createNew = false;
        let filterStrArr = createFilterStr(filter);
        for (let name in target) {
            typeof target[name] === 'object' && target[name] !== null && (target[name] = JSON.stringify(target[name]));
            tarStrArr.push(`${name}=${typeof target[name] === 'string' ? `'${dealStr(target[name])}'` : target[name]}`)
        }
        let queryStr = `UPDATE ${table} SET ${tarStrArr.join(',')}${filterStrArr}`;
        return this._connection.query(queryStr).then(result => result, err => {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                createNew = true;
                return this.addColumnIfNotExit(err,target,table);
            } else if (err.code === 'ER_NO_SUCH_TABLE') {
                return [{affectedRows: 0}];
            }
            return Promise.reject(err);
        }).then(result => {
            if(createNew && result.status) {
                return this.update(table, target, filter);
            }
            if (result[0] && result[0].affectedRows === 0) {
                return this.insert(table, target);
            }
            return success(result);
        }, err => fail(err));
    }

    end () {
        return this._connection.end();
    }

    set(...params) {
        if (params.length === 1) {
            util.extendObj(this.opts, params[0])
        } else if (params.length === 2) {
            this.opts[params[0]] = params[1];
        }
    }

    connect (optsParam) {
        let opts = optsParam || this.opts;
        let database;
        let _connect;
        if(opts.database) {
            database = opts.database;
            delete opts.database;
        }

        let returnPromise = mysql.createConnection(opts)
            .then(connect => {
                _connect = connect;
                if (database) {
                    return connect.query(`use ${database}`);
                }
                this._connection = _connect;
            }, err => {
                return Promise.reject(err);
            })
            .then(data => {
                this._connection = _connect;
            }, err => {
                if (err.code === 'ER_BAD_DB_ERROR') {
                    return _connect.query(`CREATE DATABASE ${database}`)
                } else {
                    return Promise.reject(err)
                }
            })
            .then (data => {
                this._connection = _connect;
                return success(data);
            }, err => fail(err));
        database && (opts.database = database);
        return returnPromise;
    }
}

module.exports = DatabaseQuery;