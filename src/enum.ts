export interface EnumItem<K, T> {
  key: K
  value: T
}

export class Enum<K extends string, T> {
  byKey: Map<string, EnumItem<K, T>>
  byValue: Map<T, EnumItem<K, T>>
  enums: EnumItem<K, T>[]
  constructor(obj: Record<K, T>) {
    const byKey = new Map()
    const byValue = new Map()
    const enums = []
    for (const key in obj) {
      const value = obj[key]
      const item = { key, value }
      byKey.set(key, item)
      byValue.set(value, item)
      enums.push(item)
    }
    this.byKey = byKey
    this.byValue = byValue
    this.enums = enums
  }
  get(key: string | T) {
    return this.byKey.get(key as string) || this.byValue.get(key as T)
  }
}
