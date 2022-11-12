//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Party from '../../../../build/game/characters/party/Party.js';
import { PartyAccept } from '../../../../build/game/commands/party/PartyAccept.js';
import HumanNpcFactory from '../../../../build/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';

describe('PartyAccept', () => {
  describe('execute', () => {
    let pc;
    let otherLeader;
    let invitee;
    let theWorld;
    let pcParty;
    let otherParty;

    beforeEach(async () => {
      const { pc1, world } = await createWorld();
      pc = pc1;
      theWorld = world;
      pc.transport = new FakeClient();

      const factory = new HumanNpcFactory(theWorld, pc.room);
      otherLeader = await factory.generate({ humanNpc: { name: 'otherLeader' }});
      otherLeader.transport = new FakeClient();
      theWorld.addCharacter(otherLeader);

      invitee = await factory.generate({ humanNpc: { name: 'invitee' }});
      invitee.transport = new FakeClient();
      theWorld.addCharacter(invitee);

      pcParty = await Party.createParty(pc);
      otherParty = await Party.createParty(otherLeader);
      pcParty.addInvitee(invitee);
      otherParty.addInvitee(invitee);
    });

    afterEach(async () => {
      await pcParty.destroy();
      await otherParty.destroy();
      await destroyWorld();
    });

    describe('when there is no invite', () => {
      it('tells you that', async () => {
        const uut = new PartyAccept('foo');
        await uut.execute(invitee);
        assert(invitee.transport.sentMessages.some(msg => msg.includes('You do not have an invite to join foo\'s party')));
      });
    });

    describe('when you have an invite', () => {
      describe('but the party is full', () => {
        beforeEach(() => {
          pcParty.model.maxPartyMembers = 1;
        });
        it('tells you that', async () => {
          const uut = new PartyAccept('TestCharacter');
          await uut.execute(invitee);
          assert(invitee.transport.sentMessages.some(msg => msg.includes('You cannot join TestCharacter\'s party; it is full!')));
          assert(pc.transport.sentMessages.some(msg => msg.includes('invitee cannot join your party; it is full!')));
        });
      });

      describe('when the target is valid', () => {
        it('joins the party and cancels the others', async () => {
          const uut = new PartyAccept('TestCharacter');
          await uut.execute(invitee);
          assert(invitee.transport.sentMessages.some(msg => msg.includes('You join TestCharacter\'s party')));
          assert(pc.transport.sentMessages.some(msg => msg.includes('invitee has joined your party')));
          assert(otherLeader.transport.sentMessages.some(msg => msg.includes('invitee has joined another party')));
          assert(pcParty.length === 2);
          assert(otherParty.length === 1);
        });
      });

    });

  });

});