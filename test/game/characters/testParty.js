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

    describe('getParty', () => {
      let invitee;
      let member;
      let noone;

      beforeEach(async () => {
        const factory = new HumanNpcFactory(world, pc.room);
        member = await factory.generate({ humanNpc: { name: 'test-member' }});
        world.addCharacter(member);

        invitee = await factory.generate({ humanNpc: { name: 'test-invitee' }});
        world.addCharacter(invitee);

        noone = await factory.generate({ humanNpc: { name: 'test-noone' }});
        world.addCharacter(noone);

        const model = new PartyModel();
        model.partyLeaderId = pc.id;
        model.partyMembers.push({ characterId: pc.id });
        model.partyMembers.push({ characterId: member.id });
        model.invitedMemberIds.push(invitee.id);
        await model.save();

        const party = new Party(model);
        await party.load();
      });

      describe('when you are not in a party', () => {
        it('returns what you would expect', () => {
          const uut = Party.getParty(noone);
          assert(!uut);
        });
      });

      describe('leader', () => {
        it('returns the party', () => {
          const uut = Party.getParty(pc);
          assert(uut);
          assert(uut.leader === pc);
          assert(uut.inParty(pc));
          assert(!uut.isInvited(pc));
        });
      });

      describe('member', () => {
        it('returns the party', () => {
          const uut = Party.getParty(member);
          assert(uut);
          assert(uut.leader !== member);
          assert(uut.inParty(member));
          assert(!uut.isInvited(member));
        });
      });

      describe('invited', () => {
        it('returns nothing', () => {
          const uut = Party.getParty(invitee);
          assert(!uut);
        });
      });
    });

    describe('getInvitedParties', () => {
      let invitee;
      let member;
      let otherLeader;

      beforeEach(async () => {
        const factory = new HumanNpcFactory(world, pc.room);
        member = await factory.generate({ humanNpc: { name: 'test-member' }});
        world.addCharacter(member);

        invitee = await factory.generate({ humanNpc: { name: 'test-invitee' }});
        world.addCharacter(invitee);

        otherLeader = await factory.generate({ humanNpc: { name: 'otherleader' }});
        world.addCharacter(otherLeader);

        const model = new PartyModel();
        model.partyLeaderId = pc.id;
        model.partyMembers.push({ characterId: pc.id });
        model.partyMembers.push({ characterId: member.id });
        model.invitedMemberIds.push(invitee.id);
        await model.save();

        const otherModel = new PartyModel();
        otherModel.partyLeaderId = otherLeader.id;
        otherModel.partyMembers.push({ characterId: otherLeader.id });
        otherModel.invitedMemberIds.push(invitee.id);
        await otherModel.save();

        const party = new Party(model);
        await party.load();

        const otherParty = new Party(otherModel);
        await otherParty.load();
      });

      describe('when you are not invited', () => {
        it('returns what you would expect', () => {
          const uut = Party.getInvitedParties(member);
          assert(uut);
          assert(uut.length === 0);
        });
      });

      describe('when you are invited', () => {
        it('returns all the parties', () => {
          const uut = Party.getInvitedParties(invitee);
          assert(uut);
          assert(uut.length === 2);
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

  describe('removeInvitee', () => {
    let model;
    let invitee;
    let member;

    beforeEach(async () => {
      const factory = new HumanNpcFactory(world, pc.room);
      member = await factory.generate({ humanNpc: { name: 'test-member' }});
      world.addCharacter(member);

      invitee = await factory.generate({ humanNpc: { name: 'test-invitee' }});
      world.addCharacter(invitee);

      model = new PartyModel();
      model.partyLeaderId = pc.id;
      model.partyMembers.push({ characterId: pc.id });
      model.partyMembers.push({ characterId: member.id });
      model.invitedMemberIds.push(invitee.id);
      await model.save();
    });

    describe('when the removed party is not invited', () => {
      it('does not care', async () => {
        const uut = new Party(model);
        await uut.load();
        uut.removeInvitee(member);
        assert(uut.length === 3);
      });
    });

    describe('when the removed party was invited', () => {
      it('removes them', async () => {
        const uut = new Party(model);
        await uut.load();
        uut.removeInvitee(invitee);
        assert(uut.length === 2);
      });
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