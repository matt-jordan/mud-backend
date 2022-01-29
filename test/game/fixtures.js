//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import EventEmitter from 'events';
import mongoose from 'mongoose';

import PlayerCharacter from '../../src/game/characters/playerCharacter.js';
import CharacterModel from '../../src/db/models/Character.js';
import AreaModel from '../../src/db/models/Area.js';
import RoomModel from '../../src/db/models/Room.js';
import WeaponModel from '../../src/db/models/Weapon.js';
import ArmorModel from '../../src/db/models/Armor.js';
import World from '../../src/game/world/world.js';

/** @module test/game/fixtures **/

/**
 * A mock client connection
 */
class FakeClient extends EventEmitter {

  /**
   * Create a new FakeClient
   *
   * @param {} msgCb - Callback function invoked when the client is sent a message
   */
  constructor(msgCb) {
    super();
    this.sentMessages = [];
    this.sentMessageCounter = 0;
    this.sentMessageCb = msgCb;
    this.closed = false;
  }

  /**
   * "Send" a message to the client
   *
   * @param {String} message - The message that would be sent over the socket
   */
  send(message) {
    this.sentMessages.push(message);
    this.sentMessageCounter += 1;
    if (this.sentMessageCb) {
      this.sentMessageCb(message);
    }
  }

  /**
   * "Close" the client
   */
  close() {
    this.closed = true;
  }

}

/**
 * A mock transport server that we can use to drive client interactions
 */
class FakeTransportServer extends EventEmitter {

  /**
   * Create a new FakeTransportServer
   */
  constructor() {
    super();
  }

  /**
   * Create a new client connection and emit an event as if it connected
   *
   * @param {} msgCb - Callback function invoked when the client is sent a message
   */
  createNewClient(msgCb) {
    this.emit('connection', new FakeClient(msgCb));
  }
}

/**
 * The one and only world object
 *
 * This also implies that tests should not be run in parallel, or we'll step
 * on top of ourselves
 */
let world;

/**
 * Create a world suitable for most tests
 *
 * This creates a fully functioning and loaded game world, with the following:
 *  - Two connected areas, each with two interconnected rooms
 *  - Two characters placed in the same starting room in the same area
 *
 * (TBD)
 *
 * Each test is expected to tweak the world for its test run. As such, both a
 * handle to the world as well as the underlying models/characters is returned.
 *
 * @returns {Object} - An object containins `world` and `destroyWorld`
 */
const createWorld = async () => {
  const room1_1 = new RoomModel();
  room1_1.name = 'Room1_1';
  const room1_2 = new RoomModel();
  room1_2.name = 'Room1_2';
  room1_1.exits.push({
    direction: 'north',
    destinationId: room1_2._id,
  });
  room1_2.exits.push({
    direction: 'south',
    destinationId: room1_1._id,
  });

  const area1 = new AreaModel();
  area1.name = 'TestArea1';
  area1.roomIds.push(room1_1._id);
  area1.roomIds.push(room1_2._id);
  room1_1.areaId = area1._id;
  room1_2.areaId = area1._id;

  const room2_1 = new RoomModel();
  room2_1.name = 'Room2_1';
  const room2_2 = new RoomModel();
  room2_2.name = 'Room2_2';
  room2_1.exits.push({
    direction: 'north',
    destinationId: room2_2._id,
  });
  room2_2.exits.push({
    direction: 'south',
    destinationId: room2_1._id,
  });

  const area2 = new AreaModel();
  area2.name = 'TestArea2';
  area2.roomIds.push(room2_1._id);
  area2.roomIds.push(room2_2._id);
  room2_1.areaId = area2._id;
  room2_2.areaId = area2._id;

  room2_2.exits.push({
    direction: 'up',
    destinationId: room1_2._id,
  });
  room1_2.exits.push({
    direction: 'down',
    destinationId: room2_2._id,
  });

  await room1_1.save();
  await room1_2.save();
  await area1.save();
  await room2_1.save();
  await room2_2.save();
  await area2.save();

  world = new World(new FakeTransportServer());
  await world.load();

  const characterModel = new CharacterModel();
  characterModel.name = 'TestCharacter';
  characterModel.accountId = new mongoose.Types.ObjectId();
  characterModel.description = 'A complete character';
  characterModel.age = 30;
  characterModel.gender = 'non-binary';
  characterModel.roomId = room1_1._id;
  characterModel.classes.push({
    type: 'fighter',
    level: 1,
    experience: 0,
  });
  characterModel.attributes = {
    strength: { base: 18, },
    dexterity: { base: 12, },
    constitution: { base: 14, },
    intelligence: { base: 12, },
    wisdom: { base: 8, },
    charisma: { base: 8, },
    hitpoints: { base: 6, current: 6, },
    manapoints: { base: 6, current: 6, },
    energypoints: { base: 10, current: 10, },
  };
  await characterModel.save();

  const pc1 = new PlayerCharacter(characterModel, world);
  await pc1.load();

  return {
    FakeClient,
    world,
    pc1,
  };
};

/**
 * Destroy the world fixture
 *
 * Note that we have this wrapped in the return from createWorld so we have
 * scoped access to the resources created
 */
const destroyWorld = async () => {
  await world.shutdown();
  world = null;
  await AreaModel.deleteMany();
  await RoomModel.deleteMany();
  await ArmorModel.deleteMany();
  await WeaponModel.deleteMany();
  await CharacterModel.deleteMany();
};

export {
  FakeClient,
  createWorld,
  destroyWorld,
};
