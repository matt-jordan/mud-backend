//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Party from '../../../../build/game/characters/party/Party.js';
import { PartyAbandon } from '../../../../build/game/commands/party/PartyAbandon.js';
import HumanNpcFactory from '../../../../build/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';

describe('PartyAbandon', () => {
  describe('execute', () => {
    let pc;
    let member;
    let invitee;
    let theWorld;
    let party;

    beforeEach(async () => {
      const { pc1, world } = await createWorld();
      pc = pc1;
      theWorld = world;
      pc.transport = new FakeClient();

      const factory = new HumanNpcFactory(theWorld, pc.room);
      member = await factory.generate({ humanNpc: { name: 'member' }});
      member.transport = new FakeClient();
      theWorld.addCharacter(member);

      invitee = await factory.generate({ humanNpc: { name: 'invitee' }});
      invitee.transport = new FakeClient();
      theWorld.addCharacter(invitee);

      party = await Party.createParty(pc);
      party.addMember(member);
      party.addInvitee(invitee);
    });

    afterEach(async () => {
      await party.destroy();
      await destroyWorld();
    });

    describe('when the character is not in a party', () => {
      it('tells them they are not in a party', async () => {
        const uut = new PartyAbandon();
        await uut.execute(invitee);
        assert(invitee.transport.sentMessages.some(msg => msg.includes('You are not leading a party')));
      });
    });

    describe('when the character is in a party', () => {
      describe('and they are not the leader', () => {
        it('tells them they are not leading it', async () => {
          const uut = new PartyAbandon();
          await uut.execute(member);
          assert(member.transport.sentMessages.some(msg => msg.includes('You are not leading a party')));
        });
      });

      describe('and they are the leader', () => {
        it('disbands the party', async () => {
          const uut = new PartyAbandon();
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('You have disbanded your party')));
          assert(member.transport.sentMessages.some(msg => msg.includes('TestCharacter has disbanded the party')));
          assert(invitee.transport.sentMessages.some(msg => msg.includes('TestCharacter has disbanded their party')));
        });
      });
    });
  });

});