
class Room {

  constructor(model) {
    this.model = model;
  }

  /**
   * Load in all the items from the model
   */
  async load() {
    // Pull in the attributes from the model
    this.name = this.model.name;
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
