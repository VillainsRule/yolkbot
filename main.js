import fs from 'fs';

import path from 'path';
import dispatch from '#dispatch';
import manager from '#manager';
import player from "#player";

import Matchmaker from './src/matchmaker.js';

let player_list = [];
let emails = []; // fill in here
let passwords = []; // fill in here

const loginJSONPath = path.join(import.meta.dirname, 'data', 'logins.json');
if (fs.existsSync(loginJSONPath)) JSON.parse(fs.readFileSync(loginJSONPath)).accounts.forEach(element => {
    emails.push(element.email);
    passwords.push(element.password);
});
else fs.writeFileSync(loginJSONPath, JSON.stringify({
    accounts: [
        { email: 'example@example.com', password: 'example' },
        { email: 'example2@example.com', password: 'example2' }
    ]
}, null, 4));

if (emails.length == 0 || passwords.length == 0) {
    console.log("No logins found in logins.json, please add some.");
    process.exit(1);
}

const NUM_PLAYERS = 1;

for (let i = 0; i < NUM_PLAYERS; i++) {
    player_list.push(new player.Player(process.argv[3] || 'spammer'));
}

let man = new manager.Manager(player_list);

man.on('chat', (me, player, msg) => {
    if (msg == "spawn") {
        me.dispatch(new dispatch.SpawnDispatch());
    }
}); 

man.on('respawn', (me, p) => {
    if (me.name == p.name) {
        me.dispatch(new dispatch.SpawnDispatch());
    }
});

man.on('join', (me, player) => {
    console.log(player.name, "joined.");
});

await man.login(emails, passwords);

let gameCode = process.argv[2];
if (!gameCode) {
    console.log('no game code specified, joining random game');
    let mm = new Matchmaker(man.getSessionId());

    await mm.getRegions();

    let game = await mm.findPublicGame({
        region: mm.getRandomRegion(),
        mode: mm.getRandomGameMode()
    });

    console.log('joining a public game', game.id);

    gameCode = game.id;
}

await man.join(gameCode);

setInterval(async () => { 
    man.update(); 
}, 10);
