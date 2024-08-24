## @e22m4u/js-path-trie

ES-module of the path [trie](https://en.wikipedia.org/wiki/Trie) routing.

- Uses [path-to-regexp](https://github.com/component/path-to-regexp) syntax.
- Supports path parameters.

## Installation

```bash
npm install @e22m4u/js-path-trie
```

## Example

- `add(pathTemplate: string, value: unknown)`  
  *\- adds a value by the path template*
- `match(path: string)`  
  *\- value lookup by the given path*

```js
const trie = new PathTrie();

// add values to the trie
trie.add('/foo/bar', yourValue1);
trie.add('/foo/:p1/bar/:p2', yourValue2);

// path matching
trie.match('/foo/bar');
// {
//   value: yourValue1,
//   params: {}
// }

// path matching (with parameters)
trie.match('/foo/10/bar/20');
// {
//   value: yourValue2,
//   params: {p1: 10, p2: 20}
// }

// if not matched
trie.match('/foo/bar/baz');
// undefined
```

## Debug

Do set environment variable `DEBUG=jsPathTrie*` before start.

```bash
DEBUG=jsPathTrie* npm run test
```

## Tests

```bash
npm run test
```

## License

MIT
