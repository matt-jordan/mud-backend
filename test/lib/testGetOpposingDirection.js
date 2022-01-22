import assert from 'power-assert';

import getOpposingDirection from '../../src/lib/getOpposingDirection.js';

describe('getOpposingDirection', () => {
  it('handles uppercase', () => {
    let result = getOpposingDirection('UP');
    assert(result === 'down');
    result = getOpposingDirection('Up');
    assert(result === 'down');
    result = getOpposingDirection('uP');
    assert(result === 'down');
  });

  it('handles an unknown direction by saying it is unknown', () => {
    const result = getOpposingDirection('wat');
    assert(result === 'unknown');
  });

  it('up', () => {
    assert(getOpposingDirection('up') === 'down');
  });

  it('down', () => {
    assert(getOpposingDirection('down') === 'up');
  });

  it('east', () => {
    assert(getOpposingDirection('east') === 'west');
  });

  it ('west', () => {
    assert(getOpposingDirection('west') === 'east');
  });

  it('north', () => {
    assert(getOpposingDirection('north') === 'south');
  });

  it('south', () => {
    assert(getOpposingDirection('south') === 'north');
  });

  it('northeast', () => {
    assert(getOpposingDirection('northeast') === 'southwest');
  });

  it('northwest', () => {
    assert(getOpposingDirection('northwest') === 'southeast');
  });

  it('southeast', () => {
    assert(getOpposingDirection('southeast') === 'northwest');
  });

  it('southwest', () => {
    assert(getOpposingDirection('southwest') === 'northeast');
  });
});