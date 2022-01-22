import assert from 'power-assert';

import { DefaultCommandSet } from '../../../src/game/commands/CommandSet.js';
import { LookFactory } from '../../../src/game/commands/default/Look.js';

describe('DefaultCommandSet', () => {
  describe('generate', () => {
    it('bails on a command not in its set', () => {
      const result = DefaultCommandSet.generate('foo', []);
      assert(result === null);
    });

    describe(`${LookFactory.name}`, () => {
      it('generates the command', () => {
        const result = DefaultCommandSet.generate(LookFactory.name, []);
        assert(result);
      });
    });
  });
});