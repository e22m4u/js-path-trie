import DebugFactory from 'debug';
import {format} from '@e22m4u/js-format';

/**
 * Create debugger.
 *
 * @returns {Function}
 */
export function createDebugger() {
  const debug = DebugFactory(`jsPathTrie`);
  return function (message, ...args) {
    const interpolatedMessage = format(message, ...args);
    return debug(interpolatedMessage);
  };
}
