import { BufferBuilder, BufferWithPointer } from "./buffer"
import { readDataTable } from "./dataTypeRead"
import { writeDataTable } from "./dataTypeWrite"
import { getStdType } from "./definition"
import { specialReads } from "./functionalReads"
import { specialWrites } from "./functionalWrites"
import { SecondArgument } from "./typeUtils"

export type FunctionalParamTypes = keyof (typeof specialWrites &
  typeof writeDataTable)

export class FuncPayload {
  constructor(
    public readonly direction: "clientToServer" | "serverToClient",
    public readonly cmdId: number,
    public readonly cmdName: string,
    public readonly params: [string, FunctionalParamTypes][],
    public readonly cluster: string
  ) {}

  parse(r: BufferWithPointer) {
    const data: Record<string, any> = {}
    for (let [name, type] of this.params) {
      // TODO: Remove all these dirty hacks
      switch (type) {
        case "dynUint8":
          switch (name) {
            case "scenelist":
            case "zoneidlist":
            case "zoneid":
            case "bypassresult":
              r.fwd(-1)
              type = "len8uint8" as any
              break
            case "logpayload":
              r.fwd(-4)
              type = "len32uint8" as any
              break
            case "intervals":
              r.fwd(-3) // len8 and attrId
              type = "intervals" as any
              break
            default:
              throw new Error(`unknown dynUint8 name: ${name}`)
          }
          break
        case "dynUint16":
          switch (name) {
            case "grouplist":
            case "thermoseqmode":
            case "listofattr":
            case "bypassresult":
              r.fwd(-1)
              type = "len8uint16" as any
              break
            default:
              throw new Error(`unknown dynUint16 name: ${name}`)
          }
          break
        case "dynUint24":
          switch (name) {
            case "aalert":
              r.fwd(-1)
              type = "len8uint24" as any
              break
            default:
              throw new Error(`unknown dynUint24 name: ${name}`)
          }
          break
        case "dynUint32":
          switch (name) {
            case "logid":
              r.fwd(-1)
              type = "len8uint32" as any
              break
            default:
              throw new Error(`unknown dynUint32 name: ${name}`)
          }
          break
        case "zonebuffer":
          r.fwd(-1)
          break
        case "neighborsInfo":
          r.fwd(-1)
          break
      }
      // End of dirty hacks

      const fn = specialReads[type] || readDataTable[getStdType(type)]

      if (!fn) throw new Error(`No read function for ${type}`)

      data[name] = fn(r)
    }
    return data
  }

  // args can be an array or a value-object if given
  frame(c: BufferBuilder, args) {
    if (typeof args !== "object")
      throw new TypeError("`args` must be an object or array")
    const newArgs = this.params.map(
      Array.isArray(args)
        ? ([, type], i) => ({ type, value: args[i] })
        : ([name, type]) => {
            if (!args.hasOwnProperty(name)) {
              throw new Error("The argument object has incorrect properties")
            }
            return { type, value: args[name] }
          }
    )

    frameArgs(c, newArgs)
  }
}

const frameArg = <T extends FunctionalParamTypes>(
  type: T,
  c: BufferBuilder,
  value: SecondArgument<
    T extends keyof typeof writeDataTable
      ? typeof writeDataTable[T]
      : T extends keyof typeof specialWrites
      ? typeof specialWrites[T]
      : never
  >
): void => {
  const fn: ((c: BufferBuilder, val: typeof value) => void) | undefined =
    specialWrites[type as string] || writeDataTable[getStdType(type as string)]
  if (!fn) throw new Error(`No frameArgMap defined for ${type}`)
  fn(c, value)
}
const frameArgs = (
  c: BufferBuilder,
  args: { type: FunctionalParamTypes; value: any }[]
) => {
  for (const { type, value } of args) {
    frameArg(type, c, value)
  }
}
