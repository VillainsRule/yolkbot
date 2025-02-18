import { WebSocket } from "ws";
import api from '#api';

export const PlayTypes = {
    joinPublic: 0,
    createPrivate: 1,
    joinPrivate: 2
}

export const GameModes = {
    'ffa': 0,
    'team': 1,
    'spatula': 2,
    'kotc': 3
}

class Matchmaker {
    connected = false;
    onceConnected = [];
    sessionId = '';

    forceClose = false;

    constructor(customSessionId) {
        if (customSessionId) this.sessionId = customSessionId;
        else this.createSessionId();

        this.createSocket();
    }

    createSocket() {
        this.ws = new WebSocket(`wss://shellshock.io/matchmaker/`, {
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'accept-language': 'en-US,en;q=0.9'
            }
        });

        this.ws.onopen = () => {
            this.connected = true;
            if (this.sessionId) this.onceConnected.forEach(func => func());
        };

        this.ws.onclose = () => {
            if (this.forceClose) return;

            this.connected = false;
            this.createSocket();
        }
    }

    async createSessionId() {
        let j = await api.anonymous();
        this.sessionId = j.sessionId;
        console.log('matchmaker got sessionid', this.sessionId);
        if (this.connected) this.onceConnected.forEach(func => func());
    }

    async waitForConnect() {
        return new Promise((res) => {
            if (this.connected) res();
            else this.onceConnected.push(res);
        });
    }

    async getRegions() {
        await this.waitForConnect();

        return new Promise((res) => {
            console.log('fetching regions');

            this.ws.onmessage = (e2) => {
                let data2 = JSON.parse(e2.data);
                if (data2.command == 'regionList') {
                    this.regionList = data2.regionList;
                    res(data2.regionList);
                }
            };

            this.ws.onerror = (e2) => {
                throw new Error("Failed to get regions", e2);
            }

            this.ws.send(JSON.stringify({ command: "regionList" }));
        });
    }

    async findPublicGame(params = {}) {
        await this.waitForConnect();
        
        // params.region
        // params.mode -> params.gameType
        // params.isPublic -> params.playType
        if (!params.region) throw new Error('did not specify a region in findGame, use <Matchmaker>.getRegions() for a list')

        if (this.regionList) {
            let region = this.regionList.find(r => r.id == params.region);
            if (!region) throw new Error('did not find region in regionList, if you are attempting to force a region, avoid calling getRegions()')
        } else console.log('regionList not found, not validating findGame region, use <Matchmaker>.regionList() to check region')
        
        if (!params.mode) throw new Error('did not specify a mode in findGame')
        if (GameModes[params.mode] === undefined) throw new Error('invalid mode in findGame, see GameModes for a list')

        console.log('post-modification params', params);

        return new Promise((res) => {
            let opts = {
                command: "findGame",
                region: params.region,
                playType: PlayTypes.joinPublic,
                gameType: GameModes[params.mode],
                sessionId: this.sessionId
            };

            this.ws.onmessage = (e2) => {
                let data2 = JSON.parse(e2.data);
                if (data2.command == 'gameFound') res(data2);
            };

            this.ws.send(JSON.stringify(opts));
        });
    }

    getRandomRegion() {
        if (!this.regionList) throw new Error('attempted to getRandomRegion() without fetching the regionList, use <Matchmaker>.getRegions() before calling getRandomRegion()');
        return this.regionList[Math.floor(Math.random() * this.regionList.length)].id;
    }

    getRandomGameMode() {
        let gameModeArray = Object.keys(GameModes);
        return gameModeArray[Math.floor(Math.random() * gameModeArray.length)];
    }

    close() {
        this.forceClose = true;
        this.ws.close();
    }
}

export default Matchmaker;