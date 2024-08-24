import {expect} from 'chai';
import {createDebugger} from './create-debugger.js';

describe('createDebugger', function () {
  it('returns a function', function () {
    const res = createDebugger('name');
    expect(typeof res).to.be.eq('function');
  });
});
