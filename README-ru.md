## @e22m4u/js-path-trie

*[English](./README.md) | Русский*

Маршрутизатор на основе [префиксного дерева](https://ru.wikipedia.org/wiki/Trie) (trie).

- Использует [path-to-regexp](https://github.com/pillarjs/path-to-regexp) синтаксис.
- Поддерживает параметры маршрута.

## Установка

```bash
npm install @e22m4u/js-path-trie
```

Для загрузки ES-модуля требуется установить `"type": "module"` в файле
`package.json`, или использовать `.mjs` расширение.

## Пример

- `add(pathTemplate: string, value: unknown)` - добавить значение к новому маршруту
- `match(path: string)` - поиск значения по заданному маршруту

```js
const trie = new PathTrie();

// добавление маршрутов выполняется
// методом "add", который принимает
// шаблон маршрута и его значение
trie.add('/foo/bar', yourValue1);
trie.add('/foo/:p1/bar/:p2', yourValue2);

// для поиска значения используется
// метод "match", который возвращает
// значение маршрута и его параметры
trie.match('/foo/bar');
// {
//   value: yourValue1,
//   params: {}
// }

// если маршрут имеет параметры,
// то их значения вернуться
// в результате поиска
trie.match('/foo/10/bar/20');
// {
//   value: yourValue2,
//   params: {p1: 10, p2: 20}
// }

// если маршрут не найден,
// то возвращается "undefined"
trie.match('/foo/bar/baz');
// undefined
```

## Отладка

Установка переменной `DEBUG` перед командой запуска включает вывод логов.

```bash
DEBUG=jsPathTrie* npm run test
```

## Тестирование

```bash
npm run test
```

## Лицензия

MIT
