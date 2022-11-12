//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import bunyan from 'bunyan';
function errSerializer(err) {
    return bunyan.stdSerializers.err(err);
}
export default errSerializer;
