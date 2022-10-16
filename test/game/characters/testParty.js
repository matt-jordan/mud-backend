//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import PartyModel from '../../../src/db/models/PartyModel.js';
import Party from '../../../src/game/characters/Party.js';
import HumanNpcFactory from '../../../src/game/characters/factories/HumanNpcFactory.js';
import { createWorld, destroyWorld } from '../fixtures.js';

describe('Party', () => {
  let world;
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    world = results.world;
    pc = results.pc1;
  });

  afterEach(async () => {
    await destroyWorld();
    await PartyModel.deleteMany();
  });

  describe('statics', () => {
    describe('createParty', () => {
      describe('when no party exists', () => {
        it('creates a new party', async () => {
          const uut = await Party.createParty(pc);
          assert(uut);
          assert(uut.length === 1);
          assert(Party.getParty(pc) === uut);
        });
      });

      describe('when the party leader already has a party', () => {
        it('returns the existing party', async () => {
          const uut = await Party.createParty(pc);
          assert(uut);
          assert(uut.length === 1);
          const again = await Party.createParty(pc);
          assert(uut === again);
        });
      });
    });
  });

  describe('destroyParty', () => {
    it('destroys the party', async () => {
      const uut = await Party.createParty(pc);
      assert(uut);
      await uut.destroy();
      const storedParty = Party.getParty(pc);
      assert(!storedParty);
      const model = await PartyModel.findOne({ partyLeaderId: pc.id });
      assert(!model);
    });
  });


  describe('addInvitee', () => {
    let model;
    let invitee;
    let member;

    beforeEach(async () => {
      model = new PartyModel();
      model.partyLeaderId = pc.id;
      model.partyMembers.push({ characterId: pc.id });
      await model.save();
    });

    describe('when there are too many members', () => {
      beforeEach(async () => {
        const factory = new HumanNpcFactory(world, pc.room);
        member = await factory.generate({ humanNpc: { name: 'test-member' }});
        world.addCharacter(member);

        model.maxPartyMembers = 2;
        model.partyMembers.push({ characterId: member.id });
        await model.save();

        invitee = await factory.generate({ humanNpc: { name: 'test-invitee' }});
        world.addCharacter(invitee);
      });

      it('does not add them', async () => {
        const uut = new Party(model);
        await uut.load();
        assert(uut.addInvitee(invitee) === false);
      });
    });

    describe('when the character is already invited', () => {
      beforeEach(async () => {
        const factory = new HumanNpcFactory(world, pc.room);
        invitee = await factory.generate({ humanNpc: { name: 'test-invitee' }});
        world.addCharacter(invitee);

        model.maxPartyMembers = 4;
        model.invitedMemberIds.push(invitee.id);
        await model.save();
      });

      it('does not add them twice', async () => {
        const uut = new Party(model);
        await uut.load();
        assert(uut.length === 2);
        assert(uut.addInvitee(invitee) === true);
        assert(uut.length === 2);
      });
    });

    it('adds the character', async () => {
      const uut = new Party(model);
      await uut.load();
      assert(uut.length === 1);
      assert(uut.addInvitee(invitee) === true);
      assert(uut.length === 2);
    });
  });

  describe('addMember', () => {
    let model;
    let member;

    beforeEach(async () => {
      model = new PartyModel();
      model.partyLeaderId = pc.id;
      model.partyMembers.push({ characterId: pc.id });
      model.maxPartyMembers = 3;
      await model.save();
    });

    describe('when there are too many members', () => {
      beforeEach(async () => {
        const factory = new HumanNpcFactory(world, pc.room);
        const member1 = await factory.generate({ humanNpc: { name: 'test-member1' }});
        world.addCharacter(member1);
        const member2 = await factory.generate({ humanNpc: { name: 'test-member2' }});
        world.addCharacter(member2);
        member = await factory.generate({ humanNpc: { name: 'test-member' }});
        world.addCharacter(member);

        model.partyMembers.push({ characterId: member1.id });
        model.partyMembers.push({ characterId: member2.id });
        await model.save();
      });

      it('does not add them', async () => {
        const uut = new Party(model);
        await uut.load();
        assert(uut.length === 3);
        assert(uut.addMember(member) === false);
        assert(uut.length === 3);
      });
    });

    describe('when there are too many invitees and the member is not one of them', () => {
      beforeEach(async () => {
        const factory = new HumanNpcFactory(world, pc.room);
        const invitee1 = await factory.generate({ humanNpc: { name: 'test-invitee1' }});
        world.addCharacter(invitee1);
        const member2 = await factory.generate({ humanNpc: { name: 'test-member2' }});
        world.addCharacter(member2);
        member = await factory.generate({ humanNpc: { name: 'test-member' }});
        world.addCharacter(member);

        model.invitedMemberIds.push(invitee1.id);
        model.partyMembers.push({ characterId: member2.id });
        await model.save();
      });

      it('does not add them', async () => {
        const uut = new Party(model);
        await uut.load();
        assert(uut.length === 3);
        assert(uut.addMember(member) === false);
        assert(uut.length === 3);
      });
    });

    describe('when there are too many invitees and the member is one of them', () => {
      describe('and we still dont have room', () => {
        beforeEach(async () => {
          const factory = new HumanNpcFactory(world, pc.room);
          const member1 = await factory.generate({ humanNpc: { name: 'test-member1' }});
          world.addCharacter(member1);
          const member2 = await factory.generate({ humanNpc: { name: 'test-member2' }});
          world.addCharacter(member2);
          member = await factory.generate({ humanNpc: { name: 'test-member' }});
          world.addCharacter(member);

          model.invitedMemberIds.push(member.id);
          model.partyMembers.push({ characterId: member1.id });
          model.partyMembers.push({ characterId: member2.id });
          await model.save();
        });

        it('does not add them', async () => {
          const uut = new Party(model);
          await uut.load();
          assert(uut.length === 4);
          assert(uut.addMember(member) === false);
          assert(uut.length === 4);
        });
      });

      describe('with just enough room', () => {
        beforeEach(async () => {
          const factory = new HumanNpcFactory(world, pc.room);
          const member1 = await factory.generate({ humanNpc: { name: 'test-member1' }});
          world.addCharacter(member1);
          member = await factory.generate({ humanNpc: { name: 'test-member' }});
          world.addCharacter(member);

          model.invitedMemberIds.push(member.id);
          model.partyMembers.push({ characterId: member1.id });
          await model.save();
        });

        it('adds them if it would max out the party', async () => {
          const uut = new Party(model);
          await uut.load();
          assert(uut.length === 3);
          assert(uut.addMember(member) === true);
          assert(uut.length === 3);
        });
      });
    });

    describe('when you are invited', () => {
      beforeEach(async () => {
        const factory = new HumanNpcFactory(world, pc.room);
        member = await factory.generate({ humanNpc: { name: 'test-member' }});
        world.addCharacter(member);

        model.invitedMemberIds.push(member.id);
        await model.save();
      });

      it('adds them and removes them from the invite', async () => {
        const uut = new Party(model);
        await uut.load();
        assert(uut.length === 2);
        assert(uut.addMember(member) === true);
        assert(uut.length === 2);
      });
    });

    describe('when you are not invited', () => {
      beforeEach(async () => {
        const factory = new HumanNpcFactory(world, pc.room);
        member = await factory.generate({ humanNpc: { name: 'test-member' }});
        world.addCharacter(member);
      });

      it('adds you', async () => {
        const uut = new Party(model);
        await uut.load();
        assert(uut.length === 1);
        assert(uut.addMember(member) === true);
        assert(uut.length === 2);
      });
    });
  });

  describe('load', () => {
    let member;
    let invitee;
    let model;

    beforeEach(async () => {
      const factory = new HumanNpcFactory(world, pc.room);
      member = await factory.generate({ humanNpc: { name: 'test-member' }});
      world.addCharacter(member);
      invitee = await factory.generate({ humanNpc: { name: 'test-invitee' }});
      world.addCharacter(invitee);

      model = PartyModel();
      model.partyLeaderId = pc.id;
      model.maxPartyMembers = 3;
      model.partyMembers.push({ characterId: member.id });
      model.partyMembers.push({ characterId: pc.id });
      model.invitedMemberIds.push(invitee.id);
      await model.save();
    });

    it('loads the properties into the party', async () => {
      const uut = new Party(model);
      await uut.load();
      assert(uut.length === 3);
    });

  });

  describe('save', () => {
    let member;
    let invitee;
    let model;

    beforeEach(async () => {
      const factory = new HumanNpcFactory(world, pc.room);
      member = await factory.generate({ humanNpc: { name: 'test-member' }});
      world.addCharacter(member);
      invitee = await factory.generate({ humanNpc: { name: 'test-invitee' }});
      world.addCharacter(invitee);

      model = PartyModel();
      model.partyLeaderId = pc.id;
      model.partyMembers.push({ characterId: pc.id });
      model.maxPartyMembers = 3;
      await model.save();
    });

    it('saves the expected properties', async () => {
      const uut = new Party(model);
      await uut.load();

      uut.addInvitee(invitee);
      uut.addMember(member);
    });
  });

});