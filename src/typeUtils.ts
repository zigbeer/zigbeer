export interface Callback<T> {
  (err: Error): void
  (err: null | undefined, result: T): void
}
export type SecondArgument<T> = T extends (
  arg1: any,
  arg2: infer U,
  ...args: any[]
) => any
  ? U
  : any

export type Values<T> = T[keyof T]
