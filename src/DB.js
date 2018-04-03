const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('src/config/db.json');
const db = low(adapter);
const miners = db.defaults({ miners: [] }).get('miners');
const Logger = require('./Logger');
const Util = require('./Util');

const dbLogger = new Logger('DB');

class DB {
    constructor(uuid) {
        this.uuid = uuid || Util.generateDeviceId();
        DB.set(this.uuid);
    }

    setToken(token) {
        DB.set(this.uuid, { token });
    }

    getToken() {
        return DB.get(this.uuid).token;
    }

    setCookies(cookies) {
        DB.set(this.uuid, { cookies })
    }

    getCookies() {
        return DB.get(this.uuid).cookies;
    }

    static set(uuid, data) {
        uuid = uuid || Util.generateDeviceId();
        if (!miners.find({uuid}).value()) {
            miners.push({uuid}).write();
        }
        if (data) {
            miners.find({uuid}).assign(data).write();
        }
        return DB.get(uuid);
    }

    static get(uuid) {
        return miners.find({uuid}).value();
    }

    static getAll() {
        return miners.value();
    }

    static getFirstN(num) {
        return miners.take(num).value();
    }

    static getFirstNOrCreate(num) {
        let found = DB.getFirstN(num);
        let newMiners = [];
        dbLogger.log(`Found ${found.length} of ${num} required`, found.map((miner) => miner.uuid));
        for (let i = found.length; i < num; i++) {
            newMiners.push(DB.set());
        }
        if (newMiners.length) {
            dbLogger.log(`New ${newMiners.length} created`, newMiners.map((miner) => miner.uuid));
        }
        return found.concat(newMiners);
    }

    static size() {
        return miners.size().value();
    }
}

module.exports = DB;