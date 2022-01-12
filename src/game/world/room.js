import log from '../../lib/log.js';
import MessageBus from '../../lib/messagebus/MessageBus.js';

class Room {

  constructor(model) {
    this.model = model;
    this._id = this.model._id.toString();
    this.name = 'Unloaded';
    this.description = '';
    this.characters = [];

    this.mb = MessageBus.getInstance();
  }

  get id() {
    return this._id;
  }

  toShortText() {
    return `${this.name}`;
  }

  /**
   * Add a character to the room
   *
   * @param character {PlayerCharacter} The character to add to the room
   */
  addCharacter(character) {
    if (this.characters.includes(character)) {
      log.warn({ roomId: this.id, characterId: character.id },
        'Attempted ot add duplicate character to room');
      return;
    }

    character.moveToRoom(this);
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
  }

  /**
   * Save the current attributes in the room
   */
  async save() {
    this.model.name = this.name;
    this.model.description = this.description;
  }

}

export default Room;
