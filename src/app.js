const Miner = require('./Miner');
const DB = require('./DB');
const config = require('./config/config');

(async () => {
    let miners = [];

    for (let data of DB.getFirstNOrCreate(config.workersCount)) {
        miners.push(await Miner.createAndInit(data.uuid, data.token));
    }

    console.log(`${new Date()} Started with ${miners.length} miners`);
    console.log(miners.filter((miner) => miner.status === Miner.STATUS.ACTIVE).length, `miners alive`);
})();