export interface EnumItem<K, T> {
  key: K
  value: T
}

export class Enum<K extends string, T> {
  keys: Map<T, K> = new Map()
  values: Map<K, T> = new Map()
  byKey: Map<K, EnumItem<K, T>> = new Map()
  byValue: Map<T, EnumItem<K, T>> = new Map()
  enums: EnumItem<K, T>[] = []
  constructor(obj: Record<K, T>) {
    const { keys, values, byKey, byValue, enums } = this
    for (const key in obj) {
      const value = obj[key]
      const item = { key, value }
      keys.set(value, key)
      values.set(key, value)
      byKey.set(key, item)
      byValue.set(value, item)
      enums.push(item)
    }
  }
  /**
   * Attempt to get a key-value entry, by key or value.
   * Prioritizes key over value in case of conflict.
   */
  get(key: string | T) {
    return this.byKey.get(key as K) || this.byValue.get(key as T)
  }
  /**
   * Attempt to get a key, by key or value.
   * Prioritizes key over value in case of conflict.
   */
  getKey(query: string | T | K) {
    return (this.values.has(query as K) && query as K) || this.keys.get(query as T)
  }
  /**
   * Attempt to get a value, by key or value.
   * Prioritizes **value** in case of conflict.
   */
  getValue(query: string | K | T) {
    return (this.keys.has(query as T) && query as T) || this.values.get(query as K)
  }
}
