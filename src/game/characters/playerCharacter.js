import log from '../../lib/log.js';
import MessageBus from '../../lib/messagebus/MessageBus.js';

const characterAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const modifiableAttributes = ['hitpoints', 'manapoints', 'energypoints'];

class PlayerCharacter {
  constructor(model, world) {
    this.model = model;
    this._id = this.model._id.toString();
    this.mb = MessageBus.getInstance();
    this._topics = {};
    this._transport = null;
    this.world = world;

    this.name = 'Unknown';
    this.description = '';
    this.gender = '';
    this.classes = [];
    this.age = 25;
    this.attributes = {};
    this.room = null;
    characterAttributes.forEach((attribute) => {
      this.attributes[attribute] = {};
      this.attributes[attribute].base = 10;
      this.attributes[attribute].current = 10;
    });
    modifiableAttributes.forEach((attribute) => {
      this.attributes[attribute] = {};
      this.attributes[attribute].base = 0;
      this.attributes[attribute].current = 0;
    });
  }

  get id() {
    return this._id;
  }

  toShortText() {
    return `${this.name}`;
  }

  sendImmediate(message) {
    if (!this._transport) {
      return;
    }
    this._transport.send(message);
  }

  moveToRoom(room) {
    if (this.room) {
      this.mb.unsubscribe(this._topics[this.room.id]);
      this._topics[this.room.id] = null;
    }

    log.debug({ characterId: this.id, roomId: room.id }, 'Moving to room');
    this.room = room;

    const new_sub = this.mb.subscribe(this.room.id, (packet) => {

      // By default suppresss messages sent by yourself.
      if (packet.sender && packet.sender === this.id) {
        if (!packet.options || !packet.options.sendToSelf) {
          log.debug({ characterId: this.id }, 'Suppressing message to self');
          return;
        }
      }

      this.sendImmediate(packet.text);
    });
    this._topics[this.room.id] = new_sub;

    // Send the character the room description when they enter into it
    this.sendImmediate(room.toShortText());
  }

  async load() {
    this.name = this.model.name;
    this.description = this.model.description;
    this.age = this.model.age;
    this.gender = this.model.gender;
    this.race = this.model.race;
    // This should likely map to specific instances of a class
    this.classes = this.model.classes;

    // Eventually we'll want to apply modifiers
    characterAttributes.forEach((attribute) => {
      this.attributes[attribute].base = this.model.attributes[attribute].base;
      this.attributes[attribute].current = this.attributes[attribute].base;
    });
    modifiableAttributes.forEach((attribute) => {
      this.attributes[attribute].base = this.model.attributes[attribute].base;
      this.attributes[attribute].current = this.model.attributes[attribute].current;
    });

    // Find the Room and move us into it...
    if (this.model.roomId) {
      const room = this.world.findRoomById(this.model.roomId.toString());
      if (room) {
        room.addCharacter(this);
      }
    }
  }

  async save() {
    this.model.name = this.name;
    this.model.description = this.description;
    this.model.age = this.age;
    this.model.gender = this.gender;
    this.model.race = this.race;
    // Again, this will need its own serializer
    this.model.classes = this.classes.map((characterClass) => {
      return {
        type: characterClass.type,
        level: characterClass.level,
        experience: characterClass.experience,
      };
    });

    characterAttributes.forEach((attribute) => {
      this.model.attributes[attribute].base = this.attributes[attribute].base;
    });
    modifiableAttributes.forEach((attribute) => {
      this.model.attributes[attribute].base = this.attributes[attribute].base;
      this.model.attributes[attribute].current = this.attributes[attribute].current;
    });
  }
}

export default PlayerCharacter;