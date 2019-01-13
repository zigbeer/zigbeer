interface EnumItem<T> {
  key: string
  value: T
}

export = class Enum<T> {
  byKey: Map<string, EnumItem<T>>
  byValue: Map<T, EnumItem<T>>
  enums: EnumItem<T>[]
  constructor(obj: { [key: string]: T }) {
    const byKey = new Map()
    const byValue = new Map()
    const enums = []
    for (const key in obj) {
      const value = obj[key]
      const item = { key: key, value }
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
