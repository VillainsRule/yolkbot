import { AnyGun } from '../constants/guns';
import { Item } from '../constants/items';

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface View {
    yaw: number;
    pitch: number;
}

export interface Character {
    eggColor: string;
    primaryGun: Item;
    secondaryGun: Item | number;
    stamp: Item | number;
    hat: Item | number;
    grenade: Item | number;
    melee: Item | number;
}

export interface Buffer {
    // not sure how buffers work
    // users dont need to access anyways
    [key: number]: any;
}

export interface PlayerData {
    name_: string;
    uniqueId_: string;
    playing_: boolean;
    social_: string;
    hideBadge_: boolean;
    x_: number;
    y_: number;
    z_: number;
    yaw_: number;
    pitch_: number;
    shellColor_: string;
    primaryWeaponItem_: Item;
    secondaryWeaponItem_: Item | number;
    stampItem_: Item | number;
    hatItem_: Item | number;
    grenadeItem_: Item | number;
    meleeItem_: Item | number;
    weaponIdx_: number;
}

export interface Social {
    id: number;
    url: string;
    active: boolean;
}

export class GamePlayer {
    id: string;
    team: 0 | 1 | 2;
    data: PlayerData;
    name: string;
    uniqueId: string;
    playing: boolean;
    social: Social[];
    showBadge: boolean;
    position: Position;
    jumping: boolean;
    climbing: boolean;
    view: View;
    character: Character;
    activeGun: number;
    selectedGun: number;
    weapons: AnyGun[];
    grenades: number;
    buffer: Buffer;
    kills: number;
    hp: number;
    hpShield: number;
    streakRewards: number[];
    randomSeed: number;
    serverStateIdx: number;

    constructor(id: string, team: string, playerData: PlayerData);
}

export default GamePlayer;