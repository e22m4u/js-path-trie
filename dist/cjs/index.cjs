var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.js
var index_exports = {};
__export(index_exports, {
  PathTrie: () => PathTrie
});
module.exports = __toCommonJS(index_exports);

// src/path-trie.js
var import_js_format = require("@e22m4u/js-format");
var import_js_debug = require("@e22m4u/js-debug");
var import_path_to_regexp = require("path-to-regexp");
var _PathTrie = class _PathTrie extends import_js_debug.Debuggable {
  /**
   * Constructor.
   */
  constructor() {
    super({ namespace: "jsPathTrie", noEnvironmentNamespace: true });
  }
  /**
   * Root node.
   *
   * @type {Node}
   * @private
   */
  _root = {
    token: "",
    regexp: void 0,
    names: [],
    value: void 0,
    children: {}
  };
  /**
   * Add value.
   *
   * @param {string} pathTemplate
   * @param {*} value
   * @returns {this}
   */
  add(pathTemplate, value) {
    const debug = this.getDebuggerFor(this.add);
    if (typeof pathTemplate !== "string")
      throw new import_js_format.Errorf(
        "The first argument of PathTrie.add must be a String, but %v was given.",
        pathTemplate
      );
    if (value == null)
      throw new import_js_format.Errorf(
        "The second argument of PathTrie.add is required, but %v was given.",
        value
      );
    debug("Adding a value for the path %v.", pathTemplate);
    const tokens = pathTemplate.split("/").filter(Boolean);
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
    const debug = this.getDebuggerFor(this.match);
    if (typeof path !== "string")
      throw new import_js_format.Errorf(
        "The first argument of PathTrie.match must be a String, but %v was given.",
        path
      );
    debug("Matching a value for the path %v.", path);
    const tokens = path.split("/").filter(Boolean);
    const params = {};
    const result = this._matchNode(tokens, 0, params, this._root);
    if (!result || !result.node.value) return;
    return { value: result.node.value, params };
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
    const debug = this.getDebuggerFor(this._createNode);
    if (tokens.length === 0 && index === 0) {
      if (parent.value == null) {
        parent.value = value;
      } else if (parent.value !== value) {
        throw new import_js_format.Errorf('The duplicate path "" has a different value.');
      }
      debug("The value has been set for the root node.");
      return parent;
    }
    const token = tokens[index];
    if (token == null)
      throw new import_js_format.Errorf(
        "Invalid index %v was passed to PathTrie._createNode.",
        index
      );
    let child = parent.children[token];
    const isLast = tokens.length - 1 === index;
    if (child) {
      if (!isLast) {
        debug("The node %v already exists.", token);
        return this._createNode(tokens, index + 1, value, child);
      } else {
        debug("The node %v already exists.", token);
        if (child.value == null) {
          debug("The node %v has the same value.", token);
          child.value = value;
        } else if (child.value !== value) {
          throw new import_js_format.Errorf(
            "The duplicate path %v has a different value.",
            "/" + tokens.join("/")
          );
        }
        return child;
      }
    }
    debug("The node %v does not exist.", token);
    child = {
      token,
      regexp: void 0,
      names: [],
      value: void 0,
      children: {}
    };
    if (isLast) {
      debug("The node %v is the last.", token);
      child.value = value;
    }
    if (token.indexOf(":") > -1) {
      debug("The node %v has parameters.", token);
      const modifiers = /([?*+{}])/.exec(token);
      if (modifiers)
        throw new import_js_format.Errorf(
          "The symbol %v is not supported in path %v.",
          modifiers[0],
          "/" + tokens.join("/")
        );
      let regexp, keys;
      try {
        const regexpAndKeys = (0, import_path_to_regexp.pathToRegexp)(token);
        regexp = regexpAndKeys.regexp;
        keys = regexpAndKeys.keys;
      } catch (error) {
        if (error.message.indexOf("Missing parameter") > -1)
          throw new import_js_format.Errorf(
            'The symbol ":" should be used to define path parameters, but no parameters were found in the path %v.',
            "/" + tokens.join("/")
          );
        throw error;
      }
      if (Array.isArray(keys) && keys.length) {
        child.names = keys.map((p) => `${p.name}`);
        child.regexp = regexp;
      } else {
        throw new import_js_format.Errorf(
          'The symbol ":" should be used to define path parameters, but no parameters were found in the path %v.',
          "/" + tokens.join("/")
        );
      }
      debug("The found parameters are %l.", child.names);
    }
    parent.children[token] = child;
    debug("The node %v has been created.", token);
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
    const debug = this.getDebuggerFor(this._matchNode);
    if (tokens.length === 0 && index === 0) {
      if (parent.value) {
        debug("The path %v matched the root node.", "/" + tokens.join("/"));
        return { node: parent, params };
      }
      return;
    }
    const token = tokens[index];
    if (token == null)
      throw new import_js_format.Errorf(
        "Invalid index %v was passed to PathTrie._matchNode.",
        index
      );
    const resolvedNodes = this._matchChildrenNodes(token, parent);
    debug("%v nodes match the token %v.", resolvedNodes.length, token);
    if (!resolvedNodes.length) return;
    const isLast = tokens.length - 1 === index;
    if (isLast) {
      debug("The token %v is the last.", token);
      for (const child of resolvedNodes) {
        debug("The node %v matches the token %v.", child.node.token, token);
        if (child.node.value) {
          debug("The node %v has a value.", child.node.token);
          const paramNames = Object.keys(child.params);
          if (paramNames.length) {
            paramNames.forEach((name) => {
              debug(
                "The node %v has parameter %v with the value %v.",
                child.node.token,
                name,
                child.params[name]
              );
            });
          } else {
            debug("The node %v has no parameters.", child.node.token);
          }
          Object.assign(params, child.params);
          return { node: child.node, params };
        }
      }
    } else {
      for (const child of resolvedNodes) {
        const result = this._matchNode(tokens, index + 1, params, child.node);
        if (result) {
          debug(
            "A value has been found for the path %v.",
            "/" + tokens.join("/")
          );
          const paramNames = Object.keys(child.params);
          if (paramNames.length) {
            paramNames.forEach((name) => {
              debug(
                "The node %v has parameter %v with the value %v.",
                child.node.token,
                name,
                child.params[name]
              );
            });
          } else {
            debug("The node %v has no parameters.", child.node.token);
          }
          Object.assign(params, child.params);
          return result;
        }
      }
    }
    debug(
      "No matching nodes were found for the path %v.",
      "/" + tokens.join("/")
    );
    return void 0;
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
    let child = parent.children[token];
    if (child) {
      resolvedNodes.push({ node: child, params: {} });
      return resolvedNodes;
    }
    for (const key in parent.children) {
      child = parent.children[key];
      if (!child.names || !child.regexp) continue;
      const match = child.regexp.exec(token);
      if (match) {
        const resolved = { node: child, params: {} };
        let i = 0;
        for (const name of child.names) {
          const val = match[++i];
          resolved.params[name] = decodeURIComponent(val);
        }
        resolvedNodes.push(resolved);
      }
    }
    return resolvedNodes;
  }
};
__name(_PathTrie, "PathTrie");
var PathTrie = _PathTrie;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PathTrie
});
