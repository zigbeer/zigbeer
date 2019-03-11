import { BufferBuilder } from "./buffer"
import { FailureStatus } from "./definition"

export const writeWithStatus = <R, T>(
  fn: (c: BufferBuilder, record: T) => R
) => (
  c: BufferBuilder,
  arg:
    | [
        {
          status: 0x00
        }
      ]
    | ({
        status: FailureStatus
      } & T)[]
) => {
  const { length } = arg
  for (let i = 0; i < length; i++) {
    const record = arg[i]
    c.uint8(record.status)
    if (record.status === 0x00)
      if (length === 1) return
      else throw new Error("Bad payload: successful status not alone")
    fn(c, record)
  }
}
