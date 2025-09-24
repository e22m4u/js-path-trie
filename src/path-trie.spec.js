import {expect} from 'chai';
import {PathTrie} from './path-trie.js';
import {format} from '@e22m4u/js-format';
import {pathToRegexp} from 'path-to-regexp';

const VALUE = 'myValue1';
const ANOTHER_VALUE = 'myValue2';

describe('PathTrie', function () {
  describe('add', function () {
    it('requires the first parameter to be a String', function () {
      const trie = new PathTrie();
      const throwable = v => () => trie.add(v, VALUE);
      const error = v =>
        format(
          'The first argument of PathTrie.add must be a String, ' +
            'but %s was given.',
          v,
        );
      expect(throwable(10)).to.throw(error('10'));
      expect(throwable(0)).to.throw(error('0'));
      expect(throwable(true)).to.throw(error('true'));
      expect(throwable(false)).to.throw(error('false'));
      expect(throwable(null)).to.throw(error('null'));
      expect(throwable({})).to.throw(error('Object'));
      expect(throwable([])).to.throw(error('Array'));
      expect(throwable(undefined)).to.throw(error('undefined'));
      throwable('str')();
      throwable('')();
    });

    it('requires the second parameter', function () {
      const throwable = v => () => {
        const trie = new PathTrie();
        trie.add('foo', v);
      };
      const error = v =>
        format(
          'The second argument of PathTrie.add is required, but %s was given.',
          v,
        );
      expect(throwable(undefined)).to.throw(error('undefined'));
      expect(throwable(null)).to.throw(error('null'));
      throwable('str')();
      throwable('')();
      throwable(10)();
      throwable(0)();
      throwable(true)();
      throwable(false)();
      throwable({})();
      throwable([])();
    });

    it('adds the given value with the path "" to the root node', function () {
      const trie = new PathTrie();
      expect(trie['_root']).to.be.eql({
        token: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {},
      });
      trie.add('', VALUE);
      expect(trie['_root']).to.be.eql({
        token: '',
        regexp: undefined,
        names: [],
        value: VALUE,
        children: {},
      });
    });

    it('adds the given value with the path "/" to the root node', function () {
      const trie = new PathTrie();
      expect(trie['_root']).to.be.eql({
        token: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {},
      });
      trie.add('/', VALUE);
      expect(trie['_root']).to.be.eql({
        token: '',
        regexp: undefined,
        names: [],
        value: VALUE,
        children: {},
      });
    });

    it('throws an error for the duplicate path "" with a different value', function () {
      const trie = new PathTrie();
      trie.add('', VALUE);
      const throwable = () => trie.add('', ANOTHER_VALUE);
      expect(throwable).to.throw(
        'The duplicate path "" has a different value.',
      );
    });

    it('throws an error for the duplicate path "/" with a different value', function () {
      const trie = new PathTrie();
      trie.add('/', VALUE);
      const throwable = () => trie.add('/', ANOTHER_VALUE);
      expect(throwable).to.throw(
        'The duplicate path "" has a different value.',
      );
    });

    it('considers paths "" and "/" are the same', function () {
      const trie = new PathTrie();
      trie.add('', VALUE);
      const throwable = () => trie.add('/', ANOTHER_VALUE);
      expect(throwable).to.throw(
        'The duplicate path "" has a different value.',
      );
    });

    it('adds multiple nodes by the path which has multiple tokens', function () {
      const trie = new PathTrie();
      trie.add('foo/bar/baz', VALUE);
      expect(trie['_root']).to.be.eql({
        token: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          foo: {
            token: 'foo',
            regexp: undefined,
            names: [],
            value: undefined,
            children: {
              bar: {
                token: 'bar',
                regexp: undefined,
                names: [],
                value: undefined,
                children: {
                  baz: {
                    token: 'baz',
                    regexp: undefined,
                    names: [],
                    value: VALUE,
                    children: {},
                  },
                },
              },
            },
          },
        },
      });
    });

    it('resolves path parameters in the first node', function () {
      const trie = new PathTrie();
      trie.add(':date-:time', VALUE);
      expect(trie['_root']).to.be.eql({
        token: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          ':date-:time': {
            token: ':date-:time',
            regexp: pathToRegexp(':date-:time').regexp,
            names: ['date', 'time'],
            value: VALUE,
            children: {},
          },
        },
      });
    });

    it('resolves path parameters in the middle node', function () {
      const trie = new PathTrie();
      trie.add('/foo/:id/bar', VALUE);
      expect(trie['_root']).to.be.eql({
        token: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          foo: {
            token: 'foo',
            regexp: undefined,
            names: [],
            value: undefined,
            children: {
              ':id': {
                token: ':id',
                regexp: pathToRegexp(':id').regexp,
                names: ['id'],
                value: undefined,
                children: {
                  bar: {
                    token: 'bar',
                    regexp: undefined,
                    names: [],
                    value: VALUE,
                    children: {},
                  },
                },
              },
            },
          },
        },
      });
    });

    it('throws an error for unsupported modifiers', function () {
      const modifiers = ['?', '*', '+', '{', '}'];
      const trie = new PathTrie();
      const throwable = v => () => trie.add(v, VALUE);
      const error = v =>
        format('The symbol %v is not supported in path "/foo/:id%s".', v, v);
      modifiers.forEach(m => {
        expect(throwable(`/foo/:id${m}`)).to.throw(error(m));
      });
    });

    it('throws an error if no parameter name has specified', function () {
      const trie = new PathTrie();
      const throwable = () => trie.add('/:', VALUE);
      expect(throwable).to.throw(
        'The symbol ":" should be used to define path parameters, ' +
          'but no parameters were found in the path "/:".',
      );
    });

    it('does not overrides value when set another one to the middle', function () {
      const trie = new PathTrie();
      trie.add('/foo/bar/baz', VALUE);
      trie.add('/foo/bar', ANOTHER_VALUE);
      expect(trie['_root']).to.be.eql({
        token: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          foo: {
            token: 'foo',
            regexp: undefined,
            names: [],
            value: undefined,
            children: {
              bar: {
                token: 'bar',
                regexp: undefined,
                names: [],
                value: ANOTHER_VALUE,
                children: {
                  baz: {
                    token: 'baz',
                    regexp: undefined,
                    names: [],
                    value: VALUE,
                    children: {},
                  },
                },
              },
            },
          },
        },
      });
    });
  });

  describe('match', function () {
    it('requires the first parameter to be a String', function () {
      const trie = new PathTrie();
      const throwable = v => () => trie.match(v);
      const error = v =>
        format(
          'The first argument of PathTrie.match must be ' +
            'a String, but %s was given.',
          v,
        );
      expect(throwable(10)).to.throw(error('10'));
      expect(throwable(0)).to.throw(error('0'));
      expect(throwable(true)).to.throw(error('true'));
      expect(throwable(false)).to.throw(error('false'));
      expect(throwable(null)).to.throw(error('null'));
      expect(throwable({})).to.throw(error('Object'));
      expect(throwable([])).to.throw(error('Array'));
      expect(throwable(undefined)).to.throw(error('undefined'));
      throwable('str')();
      throwable('')();
    });

    it('matches paths "" and "/" or returns undefined', function () {
      const trie = new PathTrie();
      trie.add('', VALUE);
      const res1 = trie.match('');
      const res2 = trie.match('/');
      const res3 = trie.match('/test');
      expect(res1).to.be.eql({value: VALUE, params: {}});
      expect(res2).to.be.eql({value: VALUE, params: {}});
      expect(res3).to.be.undefined;
    });

    it('returns undefined if not matched', function () {
      const trie = new PathTrie();
      trie.add('foo', VALUE);
      const res = trie.match('bar');
      expect(res).to.be.undefined;
    });

    it('matches the single token', function () {
      const trie = new PathTrie();
      trie.add('foo', VALUE);
      const res = trie.match('foo');
      expect(res).to.be.eql({value: VALUE, params: {}});
    });

    it('does not respects the prefix "/"', function () {
      const trie = new PathTrie();
      trie.add('/foo', VALUE);
      const res1 = trie.match('/foo');
      const res2 = trie.match('foo');
      expect(res1).to.be.eql({value: VALUE, params: {}});
      expect(res2).to.be.eql({value: VALUE, params: {}});
    });

    it('does not respects the postfix "/"', function () {
      const trie = new PathTrie();
      trie.add('/foo', VALUE);
      const res1 = trie.match('foo/');
      const res2 = trie.match('foo');
      expect(res1).to.be.eql({value: VALUE, params: {}});
      expect(res2).to.be.eql({value: VALUE, params: {}});
    });

    it('matches parameters of the first token', function () {
      const trie = new PathTrie();
      trie.add(':foo-:bar', VALUE);
      const res = trie.match('baz-qux');
      expect(res).to.be.eql({
        value: VALUE,
        params: {
          foo: 'baz',
          bar: 'qux',
        },
      });
    });

    it('matches parameters of the first token in the case of multiple tokens', function () {
      const trie = new PathTrie();
      trie.add(':foo-:bar/test', VALUE);
      const res = trie.match('baz-qux/test');
      expect(res).to.be.eql({
        value: VALUE,
        params: {
          foo: 'baz',
          bar: 'qux',
        },
      });
    });

    it('matches parameters of the second token', function () {
      const trie = new PathTrie();
      trie.add('/test/:foo-:bar', VALUE);
      const res = trie.match('/test/baz-qux');
      expect(res).to.be.eql({
        value: VALUE,
        params: {
          foo: 'baz',
          bar: 'qux',
        },
      });
    });

    it('does not match a path which has more tokens than needed', function () {
      const trie = new PathTrie();
      trie.add('/foo', VALUE);
      const res = trie.match('/foo/bar');
      expect(res).to.be.undefined;
    });

    it('does not match a path which has less tokens than needed', function () {
      const trie = new PathTrie();
      trie.add('/foo/bar', VALUE);
      const res = trie.match('/foo');
      expect(res).to.be.undefined;
    });
  });
});
