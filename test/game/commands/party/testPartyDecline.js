//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Party from '../../../../src/game/characters/party/Party.js';
import { PartyDecline } from '../../../../src/game/commands/party/PartyDecline.js';
import HumanNpcFactory from '../../../../src/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';

describe('PartyDecline', () => {
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
        const uut = new PartyDecline('foo');
        await uut.execute(invitee);
        assert(invitee.transport.sentMessages.some(msg => msg.includes('You do not have an invite to join foo\'s party')));
      });
    });

    describe('when you have an invite', () => {
      it('declines the right party', async () => {
        const uut = new PartyDecline('TestCharacter');
        await uut.execute(invitee);
        assert(invitee.transport.sentMessages.some(msg => msg.includes('You decline to join TestCharacter\'s party')));
        assert(pc.transport.sentMessages.some(msg => msg.includes('invitee declines to join your party')));
        assert(!otherLeader.transport.sentMessages.some(msg => msg.includes('invitee declines to join your party')));
        assert(pcParty.length === 1);
        assert(otherParty.length === 2);
      });
    });

  });

});