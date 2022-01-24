# [MJ]MUD Backend

It's 2022, and we're writing a MUD! (No, really).

I have fond memories of MUDding from college, and thought it would be fun to make a slightly more modern variant of a MUD game + engine. This particular part of the project is the backend server for the MUD. The frontend can be found in the mud-frontend repository.

# Project Structure

## API

The MUD actually has two APIs: a small REST API for handling 'CRUD' style interactions, and a 'real-time' API for the actual game itself. Currently, the REST API is backed by Express (no surprise there), while the real-time API uses WebSockets. Theoretically, we could add other transports if we wanted this game to be playable over weird things like Telnet - which would make it a true MUD - but I'm okay with the bespoke transports that we have. Purity is for the small of mind.

### AuthN/AuthZ

Authentication is handled by a pretty simple token that is generated upon successful login. Requests over either transport must provide that token. TLS is assumed to be handled by some proxy outside of this project, so the APIs are not fully secure.

AuthZ does not exist currently: all authenticated users have the same level of authorization. Eventually we may want to revisit this and bake some notion of AuthZ into the session tokens (JWT).

### REST API

This is kept fairly basic and simple - we deliberately don't use anything more complicated than Express. That keeps the project from getting too complicated and cumbersome. Routes are all assumed to require authentication unless explicitly allowlisted in the authHandler.

### Websocket

The API itself is not defined so much as just the transport. Other parts of the game interpret the packets; see the Game section for the implied packet structure.

## DB

Today, we use MongoDB fronted by Mongoose. Things that are MongoDB specific _should_ be kept wholly in this area, and we try to keep the details from bleeding too much out of here.

## Game

All the parts that make the game interesting.

### Characters

Both the player character as well as NPCs or MOBs that roam around and do things.

### Commands

Sets of commands and actions that the player can execute.

### World

The world, areas, and rooms that characters roam around in.

## Lib

Helper functions, utilities, and underlying things that make the game function. (Such as a message bus)

# Testing

Mocha tests can be run using the following:

```
$ npm run test
```

eslint can also be invoked:

```
$ npm run lint
```

# Running the Service

```
$ npm start
```

Configuration is done through environments in `config`.

