//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Party from '../../../../build/game/characters/party/Party.js';
import { PartyInvite } from '../../../../build/game/commands/party/PartyInvite.js';
import HumanNpcFactory from '../../../../build/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';

describe('PartyInvite', () => {
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
    });

    afterEach(async () => {
      await pcParty.destroy();
      await otherParty.destroy();
      await destroyWorld();
    });

    describe('when the character is not leading a party', () => {
      beforeEach(async () => {
        await pcParty.destroy();
      });

      it('tells the party leader that', async () => {
        const uut = new PartyInvite('invitee');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.some(msg => msg.includes('You are not leading a party.')));
      });
    });

    describe('when the character is not in the same room', () => {
      it('tells the party leader the character does not exist', async () => {
        const uut = new PartyInvite('wat');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.some(msg => msg.includes('You do not see \'wat\' here.')));
      });
    });

    describe('when the character is in the room', () => {
      describe('and they are the character', () => {
        it('tells you to find some friends', async () => {
          const uut = new PartyInvite('TestCharacter');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('You cannot invite yourself to your own party.')));
        });
      });

      describe('and they are in someone else\'s party', () => {
        beforeEach(async () => {
          otherParty.addMember(invitee);
        });

        it('tells the leader they are already in a party', async () => {
          const uut = new PartyInvite('invitee');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('\'invitee\' is already in a party.')));
        });
      });

      describe('and they are in your party', () => {
        beforeEach(async () => {
          pcParty.addMember(invitee);
        });

        it('tells the leader they are already in their party', async () => {
          const uut = new PartyInvite('invitee');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('\'invitee\' is already in your party.')));
        });
      });

      describe('and they are not in a party', () => {
        describe('and the party is full', () => {
          beforeEach(async () => {
            const factory = new HumanNpcFactory(theWorld, pc.room);
            const human1 = await factory.generate({ humanNpc: { name: 'human1' }});
            theWorld.addCharacter(human1);
            const human2 = await factory.generate({ humanNpc: { name: 'human2' }});
            theWorld.addCharacter(human2);
            pcParty.addMember(human1);
            pcParty.addMember(human2);
          });

          it('tells them the party is full', async () => {
            const uut = new PartyInvite('invitee');
            await uut.execute(pc);
            assert(pc.transport.sentMessages.some(msg => msg.includes('You cannot invite \'invitee\'; your party is full.')));
          });
        });

        describe('and the party is not full', () => {
          it('extends them an invite', async () => {
            const uut = new PartyInvite('invitee');
            await uut.execute(pc);
            assert(pc.transport.sentMessages.some(msg => msg.includes('You invite \'invitee\' to your party')));
            assert(invitee.transport.sentMessages.some(msg => msg.includes('TestCharacter invites you to their party')));
          });

          it('extends them multiple invites if that happens too', async () => {
            const uut = new PartyInvite('invitee');
            await uut.execute(pc);
            await uut.execute(otherLeader);
            assert(pc.transport.sentMessages.some(msg => msg.includes('You invite \'invitee\' to your party')));
            assert(otherLeader.transport.sentMessages.some(msg => msg.includes('You invite \'invitee\' to your party')));
            assert(invitee.transport.sentMessages.some(msg => msg.includes('TestCharacter invites you to their party')));
            assert(invitee.transport.sentMessages.some(msg => msg.includes('otherLeader invites you to their party')));
          });
        });
      });
    });
  });

});