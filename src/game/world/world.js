//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import config from 'config';

import AreaModel from '../../db/models/Area.js';
import SessionModel from '../../db/models/Session.js';
import CharacterModel from '../../db/models/Character.js';
import Area from './Area.js';
import PlayerCharacter from '../characters/playerCharacter.js';

import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';

/**
 * @module game/world/World
 */

// Consider moving this
async function authCheck(token) {
  const session = await SessionModel.findBySessionId(token);

  return session ? true : false;
}

/**
 * A world in which the player inhabits
 */
class World {

  /**
   * Create a new world
   *
   * @param {EventEmitter} transport - The transport server for this world
   */
  constructor(transport) {
    this.areas = [];
    this.characters = [];
    this.clients = [];
    this.transport = transport;

    this.tickCounter = 0;
    this.tickHandle = setInterval(async () => {
      log.debug({ tick: this.tickCounter }, 'Processing game world');
      if (this.tickCounter % 20 === 0) {
        await this.save();
      }
      this.tickCounter += 1;
    }, config.game.tickInterval || 3000);

    this.transport.on('connection', (client) => {
      this.clients.push(client);

      client.on('message', async (message) => {
        let packet;
        try {
          packet = JSON.parse(message);
          log.info({ packet });
          const token = packet.auth;
          if (!token || !await authCheck(token)) {
            client.send(JSON.stringify({ error: 'Unauthorized', message: 'Unauthorized client' }));
            client.close();
            return;
          }

          // Handle login of characters here; all other messages we let the PlayerCharacter
          // interpret and handle
          if (packet.messageType === 'LoginCharacter') {
            const characterId = packet.characterId;
            if (!characterId) {
              log.debug('No characterId provided with LoginCharacter command!');
              client.send(JSON.stringify({ error: 'BadMessage', message: 'Missing characterId'}));
              return;
            }

            // Make sure we don't log in characters twice
            const existingChar = this.characters.find((c) => c.id === characterId);
            if (existingChar) {
              log.debug({ characterId }, 'Associng new transport due to login for existing character');
              existingChar.transport = client;
              return;
            }

            const characterModel = await CharacterModel.findById(characterId);
            if (!characterModel) {
              log.warn({ characterId }, 'Could not find character');
              client.send(JSON.stringify({ error: 'BadMessage', message: 'Unknown character'}));
              return;
            }
            log.debug({ characterId }, 'Logging in new PlayerCharacter');
            const character = new PlayerCharacter(characterModel, this);
            character.transport = client;
            this.characters.push(character);

            // This should be the last thing that is done
            await character.load();
          }
        } catch (e) {
          log.warn({ message: e.message }, 'Failed to parse packet from client');
          client.send(JSON.stringify({ error: 'BadMessage', message: e.message }));
        }
      });

      client.on('close', (reason) => {
        log.info({ reason }, 'Client closed, disassociating transport from game world');
        const index = this.clients.indexOf(client);
        if (index > -1) {
          this.clients.splice(index, 1);
        }
      });
    });
  }

  /**
   * Find a room by its ID
   *
   * @param {String} roomId - The room to lookup
   *
   * @return {Room} The room if found, or null
   */
  findRoomById(roomId) {
    let room;
    for (const area of this.areas) {
      room = area.findRoomById(roomId);
      if (room) {
        break;
      }
    }

    return room || null;
  }

  /**
   * Load up the game world from the database models
   */
  async load() {
    log.debug('Loading world...');

    const areaModels = await AreaModel.find({});
    await asyncForEach(areaModels, async (areaModel) => {
      const area = new Area(areaModel);
      await area.load();

      this.areas.push(area);
    });
  }

  /**
   * Save the game world to the database models
   */
  async save() {
    log.debug('Saving world...');
    await asyncForEach(this.areas, async (area) => {
      await area.save();
    });
  }

  /**
   * Shut down the world
   *
   * This will stop the polling handler.
   */
  async shutdown() {
    log.debug('Shutting down world...');
    clearInterval(this.tickHandle);
    this.tickHandle = null;
  }
}

export default World;