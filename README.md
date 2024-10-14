## @e22m4u/js-path-trie

*English | [Русский](./README-ru.md)*

A router for Node.js based on
a [prefix tree](https://en.wikipedia.org/wiki/Trie) (trie).

- Uses [path-to-regexp](https://github.com/pillarjs/path-to-regexp) syntax.
- Supports path parameters.

## Installation

```bash
npm install @e22m4u/js-path-trie
```

To load the ES-module, you need to set `"type": "module"`
in the `package.json` file, or use the `.mjs` extension.

## Example

- `add(pathTemplate: string, value: unknown)` adds a value to a new route
- `match(path: string)` returns a value by a given path

```js
const trie = new PathTrie();

// route registration is performed using
// the "add" method, which takes a route
// template and its value
trie.add('/foo/bar', yourValue1);
trie.add('/foo/:p1/bar/:p2', yourValue2);

// to search for a value use the "match"
// method, which returns the route value
// and its parameters
trie.match('/foo/bar');
// {
//   value: yourValue1,
//   params: {}
// }

// if a route has parameters
// their values will be returned
// in the search result
trie.match('/foo/10/bar/20');
// {
//   value: yourValue2,
//   params: {p1: 10, p2: 20}
// }

// if a route is not found
// "undefined" is returned
trie.match('/foo/bar/baz');
// undefined
```

## Debugging

Set the `DEBUG` variable before the run command to enable log output.

```bash
DEBUG=jsPathTrie* npm run test
```

## Testing

```bash
npm run test
```

## License

MIT
