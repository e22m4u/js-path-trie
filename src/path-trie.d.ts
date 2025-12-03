/**
 * Resolved value.
 */
export type ResolvedValue<T = unknown> = {
  value: T;
  params: {[name: string]: unknown};
}

/**
 * Path trie.
 */
export declare class PathTrie {
  /**
   * Add value.
   *
   * @param pathTemplate
   * @param value
   */
  add<T>(pathTemplate: string, value: T): this;

  /**
   * Match value.
   * @param path
   */
  match<T = unknown>(path: string): ResolvedValue<T> | undefined;
}
