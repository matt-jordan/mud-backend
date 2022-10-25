//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

class PartyMetadataError extends Error {

  /**
   * Create a new error based on property metadata
   *
   * @param {String} message - The message to send to the user
   */
  constructor(message) {
    super(message);
  }

}

export default PartyMetadataError;