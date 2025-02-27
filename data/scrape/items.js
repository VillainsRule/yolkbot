import fs from 'fs';
import path from 'path';

import { UserAgent } from '../../src/constants.js';

const data = await fetch('https://shellshock.io/js/shellshock.js', {
    headers: {
        'User-Agent': UserAgent
    }
});

const js = await data.text();

const match = js.match(/\[\{id:1001,.*?\}\]/)?.[0];

// eslint-disable-next-line prefer-const
let parsed = '';

eval(`parsed = ${match}`);

fs.writeFileSync(
    path.join(import.meta.dirname, '..', 'items.js'),
    `/* eslint-disable */\nexport const Items = ${JSON.stringify(parsed, null, 4)};`
);