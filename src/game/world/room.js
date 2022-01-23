import log from '../../lib/log.js';
import asyncForEach from '../../lib/asyncForEach.js';
import MessageBus from '../../lib/messagebus/MessageBus.js';

class Room {

  constructor(model) {
    this.model = model;
    this._id = this.model._id.toString();
    this.name = 'Unloaded';
    this.description = '';
    this.characters = [];
    this.exits = {};

    this.mb = MessageBus.getInstance();
  }

  get id() {
    return this._id;
  }

  toShortText() {
    return `${this.name}`;
  }

  toText() {
    const exitDirections = Object.keys(this.exits);
    const exitText = `Exits: ${exitDirections.length !== 0 ? exitDirections.join(', ') : 'None'}`;

    return `${this.name}\n${this.description}\n${exitText}`;
  }

  /**
   * Remove a character from the room
   *
   * @param character {PlayerCharacter} The character to remove from the room
   */
  removeCharacter(character) {
    if (!this.characters.includes(character)) {
      log.debug({ roomId: this.id, characterId: character.id },
        'Tried to remove character from room they are not in');
      return;
    }
    const index = this.characters.indexOf(character);
    if (index > -1) {
      this.characters.splice(index, 1);
    }

    this.mb.publish(this.id, {
      sender: character.id,
      text: `${character.toShortText()} leaves`,
    });
  }

  /**
   * Add a character to the room
   *
   * @param character {PlayerCharacter} The character to add to the room
   */
  addCharacter(character) {
    if (this.characters.includes(character)) {
      log.warn({ roomId: this.id, characterId: character.id },
        'Attempted to add duplicate character to room');
      return;
    }
    this.characters.push(character);

    this.mb.publish(this.id, {
      sender: character.id,
      text: `${character.toShortText()} enters`,
    });
  }

  /**
   * Load in all the items from the model
   */
  async load() {
    // Pull in the attributes from the model
    this.name = this.model.name;
    log.debug({ roomName: this.name }, 'Loading room');

    this.description = this.model.description;

    // Iterate over the Character IDs, create new instances of the characters,
    // then call load() on them

    // Iterate over the Inanimate IDs, create new instances of the inanimates,
    // then call load() on them

    // Load up exits and their Doors. Note that we don't have any Inanimates that
    // refer to that... so. Nothing yet.
    if (this.model.exits) {
      this.model.exits.forEach((exit) => {
        this.exits[exit.direction] = {
          direction: exit.direction,
          destinationId: exit.destinationId.toString(),
        };
      });
    }
  }

  /**
   * Save the current attributes in the room
   */
  async save() {
    this.model.name = this.name;
    this.model.description = this.description;
    await asyncForEach(this.characters, async (character) => {
      // TODO: Save the character IDs?
      await character.save();
    });

    await this.model.save();
  }

}

export default Room;
