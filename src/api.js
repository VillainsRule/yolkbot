import WebSocket from 'ws';

import { SocksProxyAgent } from 'socks-proxy-agent';
import { USER_AGENT } from '#constants';

const firebaseKey = 'AIzaSyDP4SIjKaw6A4c-zvfYxICpbEjn1rRnN50';

async function fetchConstantsRaw() {
    const resp = await fetch('https://raw.githubusercontent.com/StateFarmNetwork/client-keys/refs/heads/main/constants_latest.json');
    const json = await resp.json();
    return json;
}

async function queryAPI(request, prox = '') {
    let ws;
    if (prox) {
        ws = new WebSocket('wss://shellshock.io/services/', {
            agent: new SocksProxyAgent(prox)
        });
    } else {
        ws = new WebSocket('wss://shellshock.io/services/');
    }

    const openPromise = new Promise((resolve, reject) => {
        ws.on('open', () => resolve(ws));
        ws.onerror = (err) => reject(err);
    });

    const connectedWs = await openPromise;

    const sendPromise = connectedWs.send(JSON.stringify(request));
    await sendPromise;

    const response = await new Promise((resolve, reject) => {
        ws.onmessage = (mes) => {
            try {
                const resp = JSON.parse(mes.data);
                resolve(resp);
            } catch (e) {
                console.log('Bad API JSON response in queryAPI with call: ' + request.cmd + ' and data: ' + JSON.stringify(request));
                console.log('Full data sent: ' + JSON.stringify(request));
                console.log('Full data received: ' + mes);
                console.log('Full error: ' + e);
            }
            ws.close();
        };
        ws.onerror = reject;

    });

    if (response.error) {
        console.log('queryAPI error:', response.error);
        return null;
    }

    return response;
}

async function login(email, password, prox = '') {

    /*
    DO NOT CALL RAW!!!! (you can if you want :3 it doesn't change anything)
    create an Account() and then call .session() to get this data
    */

    /*
    Response looks something like:
        {
            id: <int>
            firebaseId: <string>
            sessionId: <string>
            session: <int>

            ... <irrelevant data>

            kills: <int>
            deaths: <int>
            currentBalance: <int>
        }
    */

    let SUCCESS = false;
    let request, body, token;
    let k = 0;

    while (!SUCCESS) {
        try {
            request = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + firebaseKey, {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    password: password,
                    returnSecureToken: true
                }),
                headers: {
                    'user-agent': USER_AGENT,
                    'x-client-version': 'Chrome/JsCore/9.17.2/FirebaseCore-web'
                }
            })
            body = await request.json();
            token = body.idToken;
            SUCCESS = true;
        } catch (error) {
            ++k;
            if (error.code == 'auth/network-request-failed') {
                console.error('cw_api.login: Network req failed (auth/network-request-failed), retrying, k =', k);
            } else if (error.code == 'auth/missing-email') {
                console.error('cw_api.login: You did not specify any emails. Please do so in data/logins.json');
                process.exit(0);
            } else {
                console.error('cw_api.login: Error:', email, password);
                console.error('cw_api.login: Error:', error, 'k =', k);
            }
        }
    }

    // let current_time = new Date().getTime();

    const response = await queryAPI({
        cmd: 'auth',
        firebaseToken: token
    }, prox);
    // let after_time = new Date().getTime();

    // console.log("Took " + (after_time - current_time) + "ms to authenticate");

    return response;
}

async function anonymous(prox = '') {
    const request = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + firebaseKey, {
        method: 'POST',
        body: JSON.stringify({ returnSecureToken: true }),
        headers: {
            'user-agent': USER_AGENT,
            'x-client-version': 'Chrome/JsCore/9.17.2/FirebaseCore-web'
        }
    })
    const body = await request.json();
    const token = body.idToken;
    const response = await queryAPI({
        cmd: 'auth',
        firebaseToken: token
    }, prox);
    return response
}

export default {
    login,
    queryAPI,
    fetchConstantsRaw,
    anonymous
}