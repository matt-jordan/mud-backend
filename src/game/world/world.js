import AreaModel from '../../db/models/Area.js';
import SessionModel from '../../db/models/Session.js';
import CharacterModel from '../../db/models/Character.js';
import Area from './Area.js';
import PlayerCharacter from '../characters/playerCharacter.js';

import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';

// Consider moving this
async function authCheck(token) {
  const session = await SessionModel.findBySessionId(token);

  return session ? true : false;
}

class World {
  constructor(transport) {
    this.areas = [];
    this.characters = [];
    this.clients = [];
    this.transport = transport;

    this.transport.on('connection', (client) => {

      this.clients.push(client);

      client.on('message', async (message) => {
        let packet;
        try {
          packet = JSON.parse(message);
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
              client.send(JSON.stringify({ error: 'BadMessage', message: 'Missing characterId'}));
              return;
            }

            // Make sure we don't log in characters twice
            if (this.characters.find((c) => c.id === characterId)) {
              log.debug({ characterId }, 'Ignoring login for existing character');
              return;
            }

            const characterModel = await CharacterModel.findById(characterId);
            if (!characterModel) {
              client.send(JSON.stringify({ error: 'BadMessage', message: 'Unknown character'}));
              return;
            }
            log.debug({ characterId }, 'Logging in new PlayerCharacter');
            const character = new PlayerCharacter(characterModel, this);
            character.transport = client;
            this.characters.push(character);
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
   * @param roomId The room to lookup
   *
   * @return A Room object
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
   * Loads up the game world
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
}

export default World;