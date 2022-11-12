//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import HumanNpcFactory from '../../../../build/game/characters/factories/HumanNpcFactory.js';
import { PartySet } from '../../../../build/game/commands/party/PartySet.js';
import Party from '../../../../build/game/characters/party/Party.js';

describe('PartySet', () => {
  let pc;
  let member;
  let nonmember;
  let party;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();

    const factory = new HumanNpcFactory(results.world, pc.room);
    member = await factory.generate({ humanNpc: { name: 'member' }});
    member.transport = new FakeClient();

    nonmember = await factory.generate({ humanNpc: { name: 'nonmember' }});
    nonmember.transport = new FakeClient();

    party = await Party.createParty(pc);
    party.addMember(member);
  });

  afterEach(async () => {
    await party.destroy();
    await destroyWorld();
  });

  describe('auto-follow', () => {
    describe('on', () => {
      describe('when you are not in a party', () => {
        it('tells you that', async () => {
          const uut = new PartySet({ property: 'auto-follow', value: 'on', target: 'TestCharacter' });
          await uut.execute(nonmember);
          assert(nonmember.transport.sentMessages.some(msg => msg.includes('You are not in a party')));
        });
      });

      describe('when the target is not in your party', () => {
        it('tells you that', async () => {
          const uut = new PartySet({ property: 'auto-follow', value: 'on', target: 'nonmember' });
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('nonmember is not a member of the party')));
        });
      });

      describe('when the target is not is yourself', () => {
        it('tells you that', async () => {
          const uut = new PartySet({ property: 'auto-follow', value: 'on', target: 'TestCharacter' });
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('You cannot follow yourself')));
        });
      });

      describe('when everything is valid', () => {
        it('sets the property', async () => {
          const uut = new PartySet({ property: 'auto-follow', value: 'on', target: 'member' });
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('You are now auto-following \'member\'')));
        });
      });
    });

    describe('off', () => {
      describe('when you are not following anyone', () => {
        it('tells you ', async () => {
          const uut = new PartySet({ property: 'auto-follow', value: 'off' });
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('You are not following anyone')));
        });
      });

      describe('when you are following someone', () => {
        it('tells you', async () => {
          const pre = new PartySet({ property: 'auto-follow', value: 'on', target: 'member' });
          await pre.execute(pc);
          const uut = new PartySet({ property: 'auto-follow', value: 'off' });
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(msg => msg.includes('You are no longer following \'member\'')));
        });
      });
    });
  });

});