declare module "concentrate" {
  class Concentrate {
    readonly int8: (value: number) => this
    readonly uint8: (value: number) => this
    readonly int16le: (value: number) => this
    readonly uint16le: (value: number) => this
    readonly int32le: (value: number) => this
    readonly uint32le: (value: number) => this
    readonly floatle: (value: number) => this
    readonly string: (value: string, encoding: "utf8" | "ucs2") => this
    readonly buffer: (data: Buffer) => this
    readonly result: () => Buffer
  }
  export = Concentrate
}
declare module "dissolve-chunks" {
  interface Dissolve {
    readonly tap: ((
      name: string,
      fn: (this: Dissolve, name: string) => void
    ) => this) &
      ((fn: (this: Dissolve, name: string) => void) => this)
    readonly loop: ((
      name: string,
      fn: (this: Dissolve, end: () => void) => void
    ) => this) &
      ((fn: (this: Dissolve, end: () => void) => void) => this)
    readonly vars: { [key: string]: any }
    readonly uint8: (name: string) => this
    readonly uint16: (name?: string) => this
    readonly uint32: (name: string) => this
    readonly buffer: (name: string, len: number) => this
    readonly string: (name: string, len: number) => this
    readonly variable: (name: string, name2?: string) => (arg: Dissolve) => void
    readonly multi: (name: string) => (arg: Dissolve) => void
    readonly attrVal: () => (arg: Dissolve) => void
    readonly attrValStruct: () => (arg: Dissolve) => void
    readonly configReport: () => (arg: Dissolve) => void
    readonly zclFrame: (length: number) => Rule
    indexes?: number[]
  }
  interface Rule extends Dissolve {
    clause(
      ruleName: string,
      ruleFn: (this: Dissolve, ...args: any[]) => void
    ): void
  }
  interface EventEmitter {
    emit(type: string, value: any): void
    on(type: string, handler: (value: any) => void): void
    once(type: string, handler: (value: any) => void): void
    listenerCount(type: string): number
    removeListener(type: string, handler: (value: any) => void): void
  }
  interface Stream<T> extends EventEmitter {
    end(value: T): void
  }
  interface Parser extends Stream<Buffer> {}

  function dissolveChunks(): {
    Rule(): Rule
    join(rules: Rule|Rule[]): { compile(opts?: { once: boolean }): Parser }
  }
  export = dissolveChunks
}
