const axios = require('axios');
const credentials = require('./config/credentials');
const config = require('./config/config');
const Logger = require('./Logger');
const DB = require('./DB');

class Miner {
    constructor(uuid, token) {
        this.token = null;
        this.refreshTokenValue = null;
        this.handshakeToken = null;
        this.timer = null;

        this.uuid = uuid;
        this.status = Miner.STATUS.INIT;
        this.axios = Miner.createAxios();
        this.device = config.device;
        this.device.uuid = uuid;
        this.logger = new Logger(`Miner ${uuid}`);
        this.db = new DB(uuid);
        this.updateToken(token);
    }

    async loggedIn() {
        try {
            let res = await this.axios.get('/user/logged/in');
            this.logger.log(res.data);
            return !!(res.data.loggedIn && res.data.account_active === '');
        } catch (e) {
            // in case of we have no jwt token yet we'll get 401 response
            return false;
        }
    }

    async loginCheck() {
        let res = await this.axios.post('/login_check', { "_username": credentials.username, "_password": credentials.password });
        this.updateToken(res.data.token);
        this.logger.log(res.data);
        if (res.data.account_active !== '') {
            throw new Error(`${new Date()} Miner ${this.uuid} login error: ${res.data.account_active}`);
        }
    }

    async checkPin() {
        let res = await this.axios.post('/user/check/pin', { "pin_code": credentials.pin });
        this.updateToken(res.data.token);
        this.refreshTokenValue = res.data.refresh_token;
        this.logger.log(res.data);
    }

    async handshake() {
        let res = await this.axios.post(`/miner/handshake/${this.uuid}`, { "device": this.device });
        this.handshakeToken = res.data.handshake;
        this.logger.log(res.data);
    }

    async ping() {
        let res = await this.axios.post(`/miner/ping/${this.uuid}`, {
            "device": this.device,
            "loop": Miner.getRandomMinerSpeed(),
            "background": this.device.background,
            "handshake": this.handshakeToken
        });
        this.logger.log(res.data);
    }

    async refreshToken() {
        let res = await this.axios.post('/token/refresh', { "refresh_token": this.refreshTokenValue });
        this.updateToken(res.data.token);
        this.logger.log(res.data);
    }

    async getBalance() {
        let res = await this.axios.get('/wallet/balance');
        this.logger.log(res.data);
        return { balance, unlocked_balance } = res.data;
    }

    async init() {
        try {
            if (!await this.loggedIn()) {
                await this.loginCheck();
            }
            await this.checkPin();
            await this.handshake();
            await this.ping();
            this.setStatus(Miner.STATUS.ACTIVE);
            this.timer = setInterval(() => {this.timerHandler()}, 3600000);
        } catch (e) {
            this.error(e);
        }
        return this;
    }

    async timerHandler() {
        try {
            await this.refreshToken();
            await this.ping();
        } catch (e) {
            this.error(e);
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    error(e) {
        this.setStatus(Miner.STATUS.INACTIVE);
        this.logger.error(e);
    }

    setStatus(status) {
        this.status = status;
        this.logger.log(`Miner becomes ${status}`);
    }

    updateToken(token) {
        if (!token) return;
        this.axios.defaults.headers.common['authorization'] = 'Bearer ' + token;
        this.token = token;
        this.db.setToken(token);
    }

    static getRandomMinerSpeed() {
        let min = 442283;
        let max = 450000;
        return (min + (Math.random() * (max - min)) ^ 0);
    }

    static get STATUS() {
        return {
            ACTIVE: "ACTIVE",
            INACTIVE: "INACTIVE",
            INIT: "INIT"
        };
    }

    static async createAndInit(...params) {
        return await new Miner(...params).init();
    }

    static createAxios() {
        let i = axios.create();
        i.defaults.baseURL = config.axios.baseUrl;
        i.defaults.withCredentials = true;
        for (let [key, val] of Object.entries(config.axios.headers)) {
            i.defaults.headers.common[key] = val;
        }
        // let self = this;
        // i.interceptors.response.use((res) => {
        //     console.log('interceptor', self.uuid);
        //     console.log(res.headers);
        //     return res;
        // });
        return i;
    }
}

module.exports = Miner;