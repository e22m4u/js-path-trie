"use strict";
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
    super({ namespace: "jsPathTrie", noGlobalNamespace: true });
  }
  /**
   * Root node.
   *
   * @type {Node}
   * @private
   */
  _root = {
    segment: "",
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
    if (typeof pathTemplate !== "string") {
      throw new import_js_format.Errorf(
        "The first argument of PathTrie.add must be a String, but %v was given.",
        pathTemplate
      );
    }
    if (value == null) {
      throw new import_js_format.Errorf(
        "The second argument of PathTrie.add is required, but %v was given.",
        value
      );
    }
    debug("Adding a value for the path %v.", pathTemplate);
    const segments = pathTemplate.split("/").filter(Boolean);
    if (pathTemplate.endsWith("/")) {
      segments.push("");
    }
    this._createNode(segments, 0, value, this._root);
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
    if (typeof path !== "string") {
      throw new import_js_format.Errorf(
        "The first argument of PathTrie.match must be a String, but %v was given.",
        path
      );
    }
    debug("Matching a value for the path %v.", path);
    const segments = path.split("/").filter(Boolean);
    if (path.endsWith("/")) {
      segments.push("");
    }
    const params = {};
    const result = this._matchNode(segments, 0, params, this._root);
    if (!result || !result.node.value) {
      return;
    }
    return { value: result.node.value, params };
  }
  /**
   * Create node.
   *
   * @param {string[]} segments
   * @param {number} index
   * @param {*} value
   * @param {Node} parent
   * @returns {Node}
   * @private
   */
  _createNode(segments, index, value, parent) {
    const debug = this.getDebuggerFor(this._createNode);
    if (segments.length === 0 && index === 0) {
      if (parent.value == null) {
        parent.value = value;
      } else if (parent.value !== value) {
        throw new import_js_format.Errorf('The duplicate path "" has a different value.');
      }
      debug("The value has been set for the root node.");
      return parent;
    }
    const segment = segments[index];
    if (segment == null) {
      throw new import_js_format.Errorf(
        "Invalid index %v was passed to PathTrie._createNode.",
        index
      );
    }
    let child = parent.children[segment];
    const isLast = segments.length - 1 === index;
    if (child) {
      if (!isLast) {
        debug("The node %v already exists.", segment);
        return this._createNode(segments, index + 1, value, child);
      } else {
        debug("The node %v already exists.", segment);
        if (child.value == null) {
          debug("The node %v has the same value.", segment);
          child.value = value;
        } else if (child.value !== value) {
          throw new import_js_format.Errorf(
            "The duplicate path %v has a different value.",
            "/" + segments.join("/")
          );
        }
        return child;
      }
    }
    debug("The node %v does not exist.", segment);
    child = {
      segment,
      regexp: void 0,
      names: [],
      value: void 0,
      children: {}
    };
    if (isLast) {
      debug("The node %v is the last.", segment);
      child.value = value;
    }
    if (segment.indexOf(":") > -1) {
      debug("The node %v has parameters.", segment);
      const modifiers = /([?*+{}])/.exec(segment);
      if (modifiers) {
        throw new import_js_format.Errorf(
          "The symbol %v is not supported in path %v.",
          modifiers[0],
          "/" + segments.join("/")
        );
      }
      let regexp, keys;
      try {
        const regexpAndKeys = (0, import_path_to_regexp.pathToRegexp)(segment);
        regexp = regexpAndKeys.regexp;
        keys = regexpAndKeys.keys;
      } catch (error) {
        if (error.message.indexOf("Missing parameter") > -1) {
          throw new import_js_format.Errorf(
            'The symbol ":" should be used to define path parameters, but no parameters were found in the path %v.',
            "/" + segments.join("/")
          );
        }
        throw error;
      }
      if (Array.isArray(keys) && keys.length) {
        child.names = keys.map((p) => `${p.name}`);
        child.regexp = regexp;
      } else {
        throw new import_js_format.Errorf(
          'The symbol ":" should be used to define path parameters, but no parameters were found in the path %v.',
          "/" + segments.join("/")
        );
      }
      debug("The found parameters are %l.", child.names);
    }
    parent.children[segment] = child;
    debug("The node %v has been created.", segment);
    if (isLast) {
      return child;
    }
    return this._createNode(segments, index + 1, value, child);
  }
  /**
   * Match node.
   *
   * @param {string[]} segments
   * @param {number} index
   * @param {object} params
   * @param {Node} parent
   * @returns {ResolvedNode|undefined}
   * @private
   */
  _matchNode(segments, index, params, parent) {
    const debug = this.getDebuggerFor(this._matchNode);
    if (segments.length === 0 && index === 0) {
      if (parent.value) {
        debug("The path %v matched the root node.", "/" + segments.join("/"));
        return { node: parent, params };
      }
      return;
    }
    const segment = segments[index];
    if (segment == null) {
      throw new import_js_format.Errorf(
        "Invalid index %v was passed to PathTrie._matchNode.",
        index
      );
    }
    const resolvedNodes = this._matchChildrenNodes(segment, parent);
    debug("%v node(s) match the segment %v.", resolvedNodes.length, segment);
    if (!resolvedNodes.length) {
      return;
    }
    const isLast = segments.length - 1 === index;
    if (isLast) {
      debug("The segment %v is the last.", segment);
      for (const child of resolvedNodes) {
        debug(
          "The node %v matches the segment %v.",
          child.node.segment,
          segment
        );
        if (child.node.value) {
          debug("The node %v has a value.", child.node.segment);
          const paramNames = Object.keys(child.params);
          if (paramNames.length) {
            paramNames.forEach((name) => {
              debug(
                "The node %v has parameter %v with the value %v.",
                child.node.segment,
                name,
                child.params[name]
              );
            });
          } else {
            debug("The node %v has no parameters.", child.node.segment);
          }
          Object.assign(params, child.params);
          return { node: child.node, params };
        }
      }
    } else {
      for (const child of resolvedNodes) {
        const result = this._matchNode(segments, index + 1, params, child.node);
        if (result) {
          debug(
            "A value has been found for the path %v.",
            "/" + segments.join("/")
          );
          const paramNames = Object.keys(child.params);
          if (paramNames.length) {
            paramNames.forEach((name) => {
              debug(
                "The node %v has parameter %v with the value %v.",
                child.node.segment,
                name,
                child.params[name]
              );
            });
          } else {
            debug("The node %v has no parameters.", child.node.segment);
          }
          Object.assign(params, child.params);
          return result;
        }
      }
    }
    debug(
      "No matching nodes were found for the path %v.",
      "/" + segments.join("/")
    );
    return void 0;
  }
  /**
   * Match children nodes.
   *
   * @param {string} segment
   * @param {Node} parent
   * @returns {ResolvedNode[]}
   * @private
   */
  _matchChildrenNodes(segment, parent) {
    const resolvedNodes = [];
    let child = parent.children[segment];
    if (child) {
      resolvedNodes.push({ node: child, params: {} });
      return resolvedNodes;
    }
    for (const key in parent.children) {
      child = parent.children[key];
      if (!child.names || !child.regexp) {
        continue;
      }
      const match = child.regexp.exec(segment);
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
