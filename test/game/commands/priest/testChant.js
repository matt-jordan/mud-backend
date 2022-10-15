//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { ChantAction, ChantFactory } from '../../../../src/game/commands/priest/Chant.js';
import PrayerOfHealing from '../../../../src/game/effects/priest/PrayerOfHealing.js';
import HumanNpcFactory from '../../../../src/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';


describe('ChantAction', () => {
  let fighterPC;
  let priestPC;

  beforeEach(async () => {
    const results = await createWorld();
    fighterPC = results.pc1;
    fighterPC.transport = new FakeClient();

    const factory = new HumanNpcFactory(results.world, fighterPC.room);
    priestPC = await factory.generate({ humanNpc: { name: 'priest', classPackage: [ { class: 'priest', level: 2 }] }});
    priestPC.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  it('returns an error when you do not know how to chant', async () => {
    const uut = new ChantAction('prayer of healing');
    await uut.execute(fighterPC);
    assert(fighterPC.transport.sentMessages.some(msg => msg.includes('You do not know how to chant')));
  });

  describe('prayer', () => {
    describe('when you are not praying', () => {
      describe('no prayer specified', () => {
        it('asks what you want to pray', async () => {
          const uut = new ChantAction();
          await uut.execute(priestPC);
          assert(priestPC.transport.sentMessages.some(msg => msg.includes('What prayer do you want to chant?')));
        });
      });

      describe('valid prayer specified', () => {
        it('starts the prayer', async () => {
          const uut = new ChantAction('prayer of healing');
          await uut.execute(priestPC);
          assert(priestPC.transport.sentMessages.some(msg => msg.includes('You start chanting \'prayer of healing\'.')));
        });
      });

      describe('unknown prayer', () => {
        it('returns an error', async () => {
          const uut = new ChantAction('wat');
          await uut.execute(priestPC);
          assert(priestPC.transport.sentMessages.some(msg => msg.includes('You do not know \'wat\'')));
        });
      });
    });

    describe('when you are praying', () => {
      describe('and no prayer was specified', () => {
        beforeEach(() => {
          const prayer = new PrayerOfHealing({ character: priestPC, chantSkill: 1, prayerSkill: 1 });
          priestPC.effects.push(prayer);
        });

        it('tells you what you are praying', async () => {
          const uut = new ChantAction();
          await uut.execute(priestPC);
          assert(priestPC.transport.sentMessages.some(msg => msg.includes('You are chanting \'prayer of healing\'')));
        });
      });

      describe('and a valid prayer was specified', () => {
        beforeEach(() => {
          const prayer = new PrayerOfHealing({ character: priestPC, chantSkill: 1, prayerSkill: 1 });
          priestPC.effects.push(prayer);
        });

        it('stops the current prayer and starts the new one', async () => {
          const uut = new ChantAction('prayer of healing');
          await uut.execute(priestPC);
          assert(priestPC.transport.sentMessages.some(msg => msg.includes('You stop chanting \'prayer of healing\'')));
          assert(priestPC.transport.sentMessages.some(msg => msg.includes('The healing glow fades from around you')));
          assert(priestPC.transport.sentMessages.some(msg => msg.includes('You start chanting \'prayer of healing\'')));
          assert(priestPC.transport.sentMessages.some(msg => msg.includes('You are surrounded by a healing glow')));
        });
      });

      describe('and no valid prayer was specified', () => {
        beforeEach(() => {
          const prayer = new PrayerOfHealing({ character: priestPC, chantSkill: 1, prayerSkill: 1 });
          priestPC.effects.push(prayer);
        });

        it('tells you that', async () => {
          const uut = new ChantAction('wat');
          await uut.execute(priestPC);
          assert(priestPC.transport.sentMessages.some(msg => msg.includes('You do not know \'wat\'')));
        });
      });
    });
  });

  describe('stop', () => {
    describe('when you are not chanting', () => {
      it('says so', async () => {
        const uut = new ChantAction('stop');
        await uut.execute(priestPC);
        assert(priestPC.transport.sentMessages.some(msg => msg.includes('You are not chanting anything')));
      });
    });

    describe('when you are chanting', () => {
      beforeEach(() => {
        const prayer = new PrayerOfHealing({ character: priestPC, chantSkill: 1, prayerSkill: 1 });
        priestPC.effects.push(prayer);
      });

      it('stops the prayer', async () => {
        const uut = new ChantAction('stop');
        await uut.execute(priestPC);
        assert(priestPC.transport.sentMessages.some(msg => msg.includes('You stop chanting \'prayer of healing\'')));
      });
    });
  });

});

describe('ChantFactory', () => {
  describe('when no prayer is specified', () => {
    it('creates a chant action with no prayer', () => {
      const uut = new ChantFactory();
      const result = uut.generate([]);
      assert(result instanceof ChantAction);
      assert(!result.prayer);
    });
  });

  describe('when the prayer is provided', () => {
    it('sets the target correctly', () => {
      const uut = new ChantFactory();
      const result = uut.generate(['healing']);
      assert(result);
      assert(result.prayer === 'healing');
    });

    it('joins tokens as well', () => {
      const uut = new ChantFactory();
      const result = uut.generate(['hello', 'there']);
      assert(result);
      assert(result.prayer === 'hello there');
    });
  });
});
