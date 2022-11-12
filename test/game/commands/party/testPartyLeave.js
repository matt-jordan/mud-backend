//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Party from '../../../../build/game/characters/party/Party.js';
import { PartyLeave } from '../../../../build/game/commands/party/PartyLeave.js';
import HumanNpcFactory from '../../../../build/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';

describe('PartyLeave', () => {
  describe('execute', () => {
    let pc;
    let member;
    let otherPerson;
    let theWorld;
    let pcParty;

    beforeEach(async () => {
      const { pc1, world } = await createWorld();
      pc = pc1;
      theWorld = world;
      pc.transport = new FakeClient();

      const factory = new HumanNpcFactory(theWorld, pc.room);
      member = await factory.generate({ humanNpc: { name: 'member' }});
      member.transport = new FakeClient();
      theWorld.addCharacter(member);

      otherPerson = await factory.generate({ humanNpc: { name: 'other' }});
      otherPerson.transport = new FakeClient();
      theWorld.addCharacter(otherPerson);

      pcParty = await Party.createParty(pc);
      pcParty.addMember(member);
    });

    afterEach(async () => {
      await pcParty.destroy();
      await destroyWorld();
    });

    describe('when the character is not in a party', () => {
      it('tells them that', async () => {
        const uut = new PartyLeave();
        await uut.execute(otherPerson);
        assert(otherPerson.transport.sentMessages.some(msg => msg.includes('You are not in a party.')));
      });
    });

    describe('when the character is leading a party', () => {
      it('tells them they cannot leave', async () => {
        const uut = new PartyLeave();
        await uut.execute(pc);
        assert(pc.transport.sentMessages.some(msg => msg.includes('You cannot leave the party, you are leading it.')));
        assert(pcParty.length === 2);
      });
    });

    describe('when the character is a member', () => {
      it('tells them and the leader that they have left the party', async () => {
        const uut = new PartyLeave();
        await uut.execute(member);
        assert(member.transport.sentMessages.some(msg => msg.includes('You have left TestCharacter\'s party.')));
        assert(pc.transport.sentMessages.some(msg => msg.includes('member has left your party')));
        assert(pcParty.length === 1);
      });
    });
  });

});