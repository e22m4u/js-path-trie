import {expect} from 'chai';
import {PathTrie} from './path-trie.js';
import {format} from '@e22m4u/js-format';
import {pathToRegexp} from 'path-to-regexp';

const VALUE = 'myValue1';
const ANOTHER_VALUE = 'myValue2';

describe('PathTrie', function () {
  describe('add', function () {
    it('should require the parameter "pathTemplate" to be a String', function () {
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

    it('should require the parameter "value" to be a non-nullish value', function () {
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

    it('should add a value to the root node when the root path is an empty string', function () {
      const trie = new PathTrie();
      expect(trie['_root']).to.be.eql({
        segment: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {},
      });
      trie.add('', VALUE);
      expect(trie['_root']).to.be.eql({
        segment: '',
        regexp: undefined,
        names: [],
        value: VALUE,
        children: {},
      });
    });

    it('should create a child node with an empty string segment when the root path has a forward slash', function () {
      const trie = new PathTrie();
      expect(trie['_root']).to.be.eql({
        segment: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {},
      });
      trie.add('/', VALUE);
      expect(trie['_root']).to.be.eql({
        segment: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          '': {
            segment: '',
            regexp: undefined,
            names: [],
            value: VALUE,
            children: {},
          },
        },
      });
    });

    it('should throw an error for the duplicate path "" with a different value', function () {
      const trie = new PathTrie();
      trie.add('', VALUE);
      const throwable = () => trie.add('', ANOTHER_VALUE);
      expect(throwable).to.throw(
        'The duplicate path "" has a different value.',
      );
    });

    it('should throw an error for the duplicate path "/" with a different value', function () {
      const trie = new PathTrie();
      trie.add('/', VALUE);
      const throwable = () => trie.add('/', ANOTHER_VALUE);
      expect(throwable).to.throw(
        'The duplicate path "/" has a different value.',
      );
    });

    it('should consider the root path "" and the path with a forward slash "/" are not the same', function () {
      const trie = new PathTrie();
      trie.add('', VALUE);
      trie.add('/', ANOTHER_VALUE);
    });

    it('should add multiple nodes by the path which has multiple segments', function () {
      const trie = new PathTrie();
      trie.add('foo/bar/baz', VALUE);
      expect(trie['_root']).to.be.eql({
        segment: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          foo: {
            segment: 'foo',
            regexp: undefined,
            names: [],
            value: undefined,
            children: {
              bar: {
                segment: 'bar',
                regexp: undefined,
                names: [],
                value: undefined,
                children: {
                  baz: {
                    segment: 'baz',
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

    it('should create a nested node with an empty string segment when the path with multiple segments has a trailing slash', function () {
      const trie = new PathTrie();
      trie.add('foo/bar/baz/', VALUE);
      expect(trie['_root']).to.be.eql({
        segment: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          foo: {
            segment: 'foo',
            regexp: undefined,
            names: [],
            value: undefined,
            children: {
              bar: {
                segment: 'bar',
                regexp: undefined,
                names: [],
                value: undefined,
                children: {
                  baz: {
                    segment: 'baz',
                    regexp: undefined,
                    names: [],
                    value: undefined,
                    children: {
                      '': {
                        segment: '',
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
          },
        },
      });
    });

    it('should resolve path parameters in the first node', function () {
      const trie = new PathTrie();
      trie.add(':date-:time', VALUE);
      expect(trie['_root']).to.be.eql({
        segment: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          ':date-:time': {
            segment: ':date-:time',
            regexp: pathToRegexp(':date-:time').regexp,
            names: ['date', 'time'],
            value: VALUE,
            children: {},
          },
        },
      });
    });

    it('should resolve path parameters in the middle node', function () {
      const trie = new PathTrie();
      trie.add('/foo/:id/bar', VALUE);
      expect(trie['_root']).to.be.eql({
        segment: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          foo: {
            segment: 'foo',
            regexp: undefined,
            names: [],
            value: undefined,
            children: {
              ':id': {
                segment: ':id',
                regexp: pathToRegexp(':id').regexp,
                names: ['id'],
                value: undefined,
                children: {
                  bar: {
                    segment: 'bar',
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

    it('should resolve path parameters in the last node', function () {
      const trie = new PathTrie();
      trie.add('/foo/bar/:id', VALUE);
      expect(trie['_root']).to.be.eql({
        segment: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          foo: {
            segment: 'foo',
            regexp: undefined,
            names: [],
            value: undefined,
            children: {
              bar: {
                segment: 'bar',
                regexp: undefined,
                names: [],
                value: undefined,
                children: {
                  ':id': {
                    segment: ':id',
                    regexp: pathToRegexp(':id').regexp,
                    names: ['id'],
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

    it('should throw an error for unsupported modifiers', function () {
      const modifiers = ['?', '*', '+', '{', '}'];
      const trie = new PathTrie();
      const throwable = v => () => trie.add(v, VALUE);
      const error = v =>
        format('The symbol %v is not supported in path "/foo/:id%s".', v, v);
      modifiers.forEach(m => {
        expect(throwable(`/foo/:id${m}`)).to.throw(error(m));
      });
    });

    it('should throw an error if no parameter name is specified', function () {
      const trie = new PathTrie();
      const throwable = () => trie.add('/:', VALUE);
      expect(throwable).to.throw(
        'The symbol ":" should be used to define path parameters, ' +
          'but no parameters were found in the path "/:".',
      );
    });

    it('should not override value when set another one to the middle', function () {
      const trie = new PathTrie();
      trie.add('/foo/bar/baz', VALUE);
      trie.add('/foo/bar', ANOTHER_VALUE);
      expect(trie['_root']).to.be.eql({
        segment: '',
        regexp: undefined,
        names: [],
        value: undefined,
        children: {
          foo: {
            segment: 'foo',
            regexp: undefined,
            names: [],
            value: undefined,
            children: {
              bar: {
                segment: 'bar',
                regexp: undefined,
                names: [],
                value: ANOTHER_VALUE,
                children: {
                  baz: {
                    segment: 'baz',
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
    it('should require the parameter "path" to be a String', function () {
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

    it('should match the root path "" or return undefined', function () {
      const trie = new PathTrie();
      expect(trie.match('')).to.be.undefined;
      trie.add('', VALUE);
      expect(trie.match('')).to.be.eql({value: VALUE, params: {}});
      expect(trie.match('/')).to.be.undefined;
      expect(trie.match('/test')).to.be.undefined;
      expect(trie.match('/test/')).to.be.undefined;
    });

    it('should match the root path "/" or return undefined', function () {
      const trie = new PathTrie();
      expect(trie.match('/')).to.be.undefined;
      trie.add('/', VALUE);
      expect(trie.match('/')).to.be.eql({value: VALUE, params: {}});
      expect(trie.match('')).to.be.undefined;
      expect(trie.match('/test')).to.be.undefined;
      expect(trie.match('/test/')).to.be.undefined;
    });

    it('should match the path with a single segment or return undefined', function () {
      const trie = new PathTrie();
      expect(trie.match('foo')).to.be.undefined;
      trie.add('foo', VALUE);
      expect(trie.match('foo')).to.be.eql({value: VALUE, params: {}});
      expect(trie.match('')).to.be.undefined;
      expect(trie.match('/')).to.be.undefined;
      expect(trie.match('/bar')).to.be.undefined;
      expect(trie.match('/bar/')).to.be.undefined;
    });

    it('should ignore a forward slash "/" as the path prefix', function () {
      const trie = new PathTrie();
      trie.add('/foo', VALUE);
      const res1 = trie.match('/foo');
      const res2 = trie.match('foo');
      expect(res1).to.be.eql({value: VALUE, params: {}});
      expect(res2).to.be.eql({value: VALUE, params: {}});
    });

    it('should respect a forward slash "/" as the trailing slash', function () {
      const trie = new PathTrie();
      trie.add('foo', VALUE);
      trie.add('foo/', ANOTHER_VALUE);
      const res1 = trie.match('foo');
      const res2 = trie.match('foo/');
      expect(res1).to.be.eql({value: VALUE, params: {}});
      expect(res2).to.be.eql({value: ANOTHER_VALUE, params: {}});
    });

    it('should match parameters of the first segment', function () {
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

    it('should match parameters of the first segment in the case of multiple segments', function () {
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

    it('should match parameters of the second segment', function () {
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

    it('should ignore the path which has more segments than needed', function () {
      const trie = new PathTrie();
      trie.add('/foo', VALUE);
      const res = trie.match('/foo/bar');
      expect(res).to.be.undefined;
    });

    it('should ignore the path which has less segments than needed', function () {
      const trie = new PathTrie();
      trie.add('/foo/bar', VALUE);
      const res = trie.match('/foo');
      expect(res).to.be.undefined;
    });
  });
});
