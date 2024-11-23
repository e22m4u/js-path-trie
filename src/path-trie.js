import {Errorf} from '@e22m4u/js-format';
import {pathToRegexp} from 'path-to-regexp';
import {createDebugger} from './utils/index.js';

/**
 * @typedef {{
 *   token: string,
 *   regexp: RegExp | undefined,
 *   names: string[],
 *   value: *,
 *   children: {[token: string]: Node},
 * }} Node
 *
 * @typedef {{value: *, params: object}} ResolvedValue
 * @typedef {{node: Node, params: object}} ResolvedNode
 */

/**
 * Debug.
 *
 * @type {Function}
 */
const debug = createDebugger();

/**
 * Path trie.
 */
export class PathTrie {
  /**
   * Root node.
   *
   * @type {Node}
   * @private
   */
  _root = {
    token: '',
    regexp: undefined,
    names: [],
    value: undefined,
    children: {},
  };

  /**
   * Add value.
   *
   * @param {string} pathTemplate
   * @param {*} value
   * @returns {this}
   */
  add(pathTemplate, value) {
    if (typeof pathTemplate !== 'string')
      throw new Errorf(
        'The first argument of PathTrie.add should be ' +
          'a String, but %v given.',
        pathTemplate,
      );
    if (value == null)
      throw new Errorf(
        'The second argument of PathTrie.add is required, but %v given.',
        value,
      );
    debug('Adding the value to %v.', pathTemplate);
    const tokens = pathTemplate.split('/').filter(Boolean);
    this._createNode(tokens, 0, value, this._root);
    return this;
  }

  /**
   * Match value.
   *
   * @param {string} path
   * @returns {ResolvedValue|undefined}
   */
  match(path) {
    if (typeof path !== 'string')
      throw new Errorf(
        'The first argument of PathTrie.match should be ' +
          'a String, but %v given.',
        path,
      );
    debug('Matching a value with the path %v.', path);
    const tokens = path.split('/').filter(Boolean);
    const params = {};
    const result = this._matchNode(tokens, 0, params, this._root);
    if (!result || !result.node.value) return;
    return {value: result.node.value, params};
  }

  /**
   * Create node.
   *
   * @param {string[]} tokens
   * @param {number} index
   * @param {*} value
   * @param {Node} parent
   * @returns {Node}
   * @private
   */
  _createNode(tokens, index, value, parent) {
    // если массив токенов пуст, а индекс нулевой,
    // то проверяем возможность установки значения
    // в родителя
    if (tokens.length === 0 && index === 0) {
      // если корневой узел не имеет
      // значения, то устанавливаем
      if (parent.value == null) {
        parent.value = value;
      }
      // если корневой узел имеет значение
      // отличное от устанавливаемого,
      // то выбрасываем ошибку
      else if (parent.value !== value) {
        throw new Errorf('The duplicate path "" has a different value.');
      }
      debug('The value has set to the root node.');
      return parent;
    }
    // проверка существования токена
    // по данному индексу
    const token = tokens[index];
    if (token == null)
      throw new Errorf(
        'Invalid index %v has passed to the PathTrie._createNode.',
        index,
      );
    // проверка существования узла
    // по текущему токену
    let child = parent.children[token];
    const isLast = tokens.length - 1 === index;
    if (child) {
      // если узел не является последним,
      // то переходим к следующему
      if (!isLast) {
        debug('The node %v already exist.', token);
        return this._createNode(tokens, index + 1, value, child);
      }
      // если узел является последним,
      // то проверяем наличие значения
      else {
        debug('The node %v already exist.', token);
        // если существующий узел не имеет
        // значения, то устанавливаем текущее
        if (child.value == null) {
          debug('The node %v has the same value.', token);
          child.value = value;
        }
        // если существующий узел имеет
        // значение отличное от текущего,
        // то выбрасываем ошибку
        else if (child.value !== value) {
          throw new Errorf(
            'The duplicate path %v has a different value.',
            '/' + tokens.join('/'),
          );
        }
        // так как данный токен является последним,
        // то возвращаем существующий узел
        return child;
      }
    }
    debug('The node %v does not exist.', token);
    // создаем новый узел, и если токен является
    // последним, то сразу устанавливаем значение
    child = {
      token,
      regexp: undefined,
      names: [],
      value: undefined,
      children: {},
    };
    if (isLast) {
      debug('The node %v is last.', token);
      child.value = value;
    }
    // если токен содержит параметры,
    // то записываем их имена и регулярное
    // выражение в создаваемый узел
    if (token.indexOf(':') > -1) {
      debug('The node %v has parameters.', token);
      // если токен содержит неподдерживаемые
      // модификаторы, то выбрасываем ошибку
      const modifiers = /([?*+{}])/.exec(token);
      if (modifiers)
        throw new Errorf(
          'The symbol %v is not supported in path %v.',
          modifiers[0],
          '/' + tokens.join('/'),
        );
      // определение регулярного выражения
      // и параметров текущего токена
      let regexp, keys;
      try {
        const regexpAndKeys = pathToRegexp(token);
        regexp = regexpAndKeys.regexp;
        keys = regexpAndKeys.keys;
      } catch (error) {
        // если параметры не найдены, то выбрасываем
        // ошибку неправильного использования
        // символа ":"
        if (error.message.indexOf('Missing parameter') > -1)
          throw new Errorf(
            'The symbol ":" should be used to define path parameters, ' +
              'but no parameters found in the path %v.',
            '/' + tokens.join('/'),
          );
        // если ошибка неизвестна,
        // то выбрасываем как есть
        throw error;
      }
      // записываем имена параметров и регулярное
      // выражение в создаваемый узел
      if (Array.isArray(keys) && keys.length) {
        child.names = keys.map(p => `${p.name}`);
        child.regexp = regexp;
      }
      // если параметры не найдены, то выбрасываем
      // ошибку неправильного использования
      // символа ":"
      else {
        throw new Errorf(
          'The symbol ":" should be used to define path parameters, ' +
            'but no parameters found in the path %v.',
          '/' + tokens.join('/'),
        );
      }
      debug('Found parameters are %l.', child.names);
    }
    // записываем новый узел в родителя
    parent.children[token] = child;
    debug('The node %v has created.', token);
    // если текущий узел является последним,
    // то возвращаем его, или продолжаем
    // смещать индекс
    if (isLast) return child;
    return this._createNode(tokens, index + 1, value, child);
  }

  /**
   * Match node.
   *
   * @param {string[]} tokens
   * @param {number} index
   * @param {object} params
   * @param {Node} parent
   * @returns {ResolvedNode|undefined}
   * @private
   */
  _matchNode(tokens, index, params, parent) {
    // если массив токенов пуст, а индекс нулевой,
    // то проверяем наличие значения в родителе
    if (tokens.length === 0 && index === 0) {
      if (parent.value) {
        debug(
          'The path %v matched with the root node.',
          '/' + tokens.join('/'),
        );
        return {node: parent, params};
      }
      // если родительский узел не имеет
      // значения, то возвращаем "undefined"
      return;
    }
    // проверка существования токена
    // по данному индексу
    const token = tokens[index];
    if (token == null)
      throw new Errorf(
        'Invalid index %v has passed to the PathTrie._matchNode.',
        index,
      );
    // если текущий токен не соответствует
    // ни одному узлу, то возвращаем "undefined"
    const resolvedNodes = this._matchChildrenNodes(token, parent);
    debug('%v nodes matches the token %v.', resolvedNodes.length, token);
    if (!resolvedNodes.length) return;
    // если текущий токен последний,
    // то возвращаем первый дочерний
    // узел, который имеет значение
    const isLast = tokens.length - 1 === index;
    if (isLast) {
      debug('The token %v is last.', token);
      for (const child of resolvedNodes) {
        debug('The node %v matches the token %v.', child.node.token, token);
        if (child.node.value) {
          debug('The node %v has a value.', child.node.token);
          const paramNames = Object.keys(child.params);
          if (paramNames.length) {
            paramNames.forEach(name => {
              debug(
                'The node %v has parameter %v with the value %v.',
                child.node.token,
                name,
                child.params[name],
              );
            });
          } else {
            debug('The node %v has no parameters.', child.node.token);
          }
          Object.assign(params, child.params);
          return {node: child.node, params};
        }
      }
    }
    // если токен промежуточный, то проходим
    // вглубь каждого дочернего узла
    else {
      for (const child of resolvedNodes) {
        const result = this._matchNode(tokens, index + 1, params, child.node);
        if (result) {
          debug('A value has found for the path %v.', '/' + tokens.join('/'));
          const paramNames = Object.keys(child.params);
          if (paramNames.length) {
            paramNames.forEach(name => {
              debug(
                'The node %v has parameter %v with the value %v.',
                child.node.token,
                name,
                child.params[name],
              );
            });
          } else {
            debug('The node %v has no parameters.', child.node.token);
          }
          Object.assign(params, child.params);
          return result;
        }
      }
    }
    // если поиск по дочерним узлам
    // родителя не привел к результату,
    // то возвращаем "undefined"
    debug('No matched nodes with the path %v.', '/' + tokens.join('/'));
    return undefined;
  }

  /**
   * Match children nodes.
   *
   * @param {string} token
   * @param {Node} parent
   * @returns {ResolvedNode[]}
   * @private
   */
  _matchChildrenNodes(token, parent) {
    const resolvedNodes = [];
    // если найден узел по литералу токена,
    // то нет необходимости продолжать поиск
    // по узлам с параметрами, а можно немедленно
    // вернуть его в качестве результата
    let child = parent.children[token];
    if (child) {
      resolvedNodes.push({node: child, params: {}});
      return resolvedNodes;
    }
    // поиск по узлам с параметрами выполняется
    // путем сопоставления токена с регулярным
    // выражением каждого узла
    for (const key in parent.children) {
      child = parent.children[key];
      if (!child.names || !child.regexp) continue;
      const match = child.regexp.exec(token);
      if (match) {
        const resolved = {node: child, params: {}};
        // так как параметры имеют тот же порядок,
        // что и вхождения, последовательно перебираем,
        // и присваиваем вхождения с соответствующим
        // индексом в качестве значений
        let i = 0;
        for (const name of child.names) {
          const val = match[++i];
          resolved.params[name] = decodeURIComponent(val);
        }
        // добавление узла к результату
        resolvedNodes.push(resolved);
      }
    }
    return resolvedNodes;
  }
}
