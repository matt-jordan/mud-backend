//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------


class LightEffect {
  #character;

  constructor({ character, source = 'None' }) {
    this.#character = character;
    this.source = source;
  }

  get name() {
    return 'light';
  }

  /**
   * The verbs associated with the effect
   */
  get verbs() {
    return {
      firstPerson: 'illuminate',
      thirdPerson: 'illuminates',
    };
  }

  /**
   * Adjective describing the effect
   */
  get adjective() {
    return 'illuminated';
  }

  /**
   * The type of action this is
   *
   * @returns {String}
   */
  get actionType() {
    return 'effect';
  }

  /**
   * Check if the player can perform the requested action
   *
   * @returns {Boolean} True if they can perform the action, false otherwise
   */
  checkAction() {
    // Lights have no impact on character actions
    return true;
  }

  /**
   * Callback called when this action is first added to a character
   */
  onInitialPush() {
  }

  /**
   * Callback called when this action is no longer in effect on a character
   */
  onExpire() {
  }

}

export default LightEffect;
