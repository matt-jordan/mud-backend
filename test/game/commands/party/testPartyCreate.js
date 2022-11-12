//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Party from '../../../../build/game/characters/party/Party.js';
import { PartyCreate } from '../../../../build/game/commands/party/PartyCreate.js';
import HumanNpcFactory from '../../../../build/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';

describe('PartyCreate', () => {
  describe('execute', () => {
    let pc;
    let theWorld;

    beforeEach(async () => {
      const { pc1, world } = await createWorld();
      pc = pc1;
      theWorld = world;
      pc.transport = new FakeClient();
    });

    afterEach(async () => {
      await destroyWorld();
    });

    describe('when the character is in a party', () => {
      describe('and they are the leader', () => {
        let party;

        beforeEach(async () => {
          party = await Party.createParty(pc);
        });

        afterEach(async () => {
          await party.destroy();
        });

        it('tells them they are already leading a party', async () => {
          const uut = new PartyCreate();
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('You are already leading a party')));
        });
      });

      describe('and they are not the leader', () => {
        let party;

        beforeEach(async () => {
          const factory = new HumanNpcFactory(theWorld, pc.room);
          const priest = await factory.generate({ humanNpc: { name: 'priest', classPackage: [ { class: 'priest', level: 1 }] }});
          theWorld.addCharacter(priest);

          party = await Party.createParty(priest);
          party.addMember(pc);
        });

        afterEach(async () => {
          await party.destroy();
        });

        it('tells them they are in another person\'s party', async () => {
          const uut = new PartyCreate();
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('You are already in priest\'s party')));
        });
      });
    });

    describe('when they are not in a party', () => {
      afterEach(async () => {
        const party = Party.getParty(pc);
        if (party) {
          await party.destroy();
        }
      });

      it('creates a party with the expected properties', async () => {
        const uut = new PartyCreate();
        await uut.execute(pc);
        assert(pc.transport.sentMessages.some(msg => msg.includes('You form a party')));
      });
    });
  });

});