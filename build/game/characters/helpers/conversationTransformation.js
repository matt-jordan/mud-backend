//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
/*
 * @module game/characters/helpers/conversationTransformation
 */
function conversationTransformation(text, character) {
    let newText;
    newText = text.replace(/{{character}}/g, character.toShortText());
    return newText;
}
export default conversationTransformation;
