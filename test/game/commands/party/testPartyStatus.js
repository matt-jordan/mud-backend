//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Party from '../../../../src/game/characters/party/Party.js';
import { PartyStatus } from '../../../../src/game/commands/party/PartyStatus.js';
import HumanNpcFactory from '../../../../src/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';

describe('PartyStatus', () => {
  describe('execute', () => {
    let pc;
    let member;
    let theWorld;
    let pcParty;

    beforeEach(async () => {
      const { pc1, world } = await createWorld();
      pc = pc1;
      theWorld = world;
      pc.transport = new FakeClient();

      const factory = new HumanNpcFactory(theWorld, pc.room);
      member = await factory.generate({ humanNpc: { name: 'priest', classPackage: [ { class: 'priest', level: 1 }] }});
      member.transport = new FakeClient();
      theWorld.addCharacter(member);

      pcParty = await Party.createParty(pc);
    });

    afterEach(async () => {
      await pcParty.destroy();
      await destroyWorld();
    });

    describe('when the character is not in a party', () => {
      it('tells them that', async () => {
        const uut = new PartyStatus();
        await uut.execute(member);
        assert(member.transport.sentMessages.some(msg => msg.includes('You are not in a party.')));
      });
    });

    describe('when the character is in a party', () => {
      beforeEach(() => {
        pcParty.addMember(member);
      });

      it('gives them the status', async () => {
        const uut = new PartyStatus();
        await uut.execute(pc);
        assert(pc.transport.sentMessages.some(msg => msg.includes('"leader":{"name":"TestCharacter","classes":[{"type":"fighter","level":1,"experience":0,"maxExperience":1000}]}')));
        assert(pc.transport.sentMessages.some(msg => msg.includes('"members":[{"name":"priest","classes":[{"type":"priest","level":1,"experience":0,"maxExperience":1000}]}]')));
      });
    });
  });

});