import { ZclID } from "zcl-id"
import { BufferBuilder, BufferWithPointer } from "./buffer"
import { readDataTable } from "./dataTypeRead"
import { writeDataTable } from "./dataTypeWrite"
import { getStdType } from "./definition"
import { specialReads } from "./functionalReads"
import { specialWrites } from "./functionalWrites"
import { SecondArgument } from "./typeUtils"

type ParamTypes = keyof (typeof specialWrites & typeof writeDataTable)

export class FuncPayload {
  direction: string
  cluster: string
  cmd: string
  cmdId: number
  params: [string, ParamTypes][]
  constructor(
    clusterId: string | number,
    direction: 0 | 1,
    cmd: string | number,
    zclId: ZclID
  ) {
    const cluster = zclId.cluster(clusterId)

    if (!cluster) {
      throw new Error(`Unknown cluster ${clusterId}`)
    }

    this.cluster = cluster.key

    const cmdEntry = direction
      ? zclId.getCmdRsp(this.cluster, cmd)
      : zclId.functional(this.cluster, cmd)
    if (!cmdEntry) throw new Error(`Unknown command ${this.cluster}/${cmd}`)

    this.cmd = cmdEntry.key

    const wholeCommand = zclId.zclmeta.functional.get(this.cluster, this.cmd)
    if (!wholeCommand)
      throw new Error(`Unknown command ${this.cluster}/${this.cmd}`)
    this.cmdId = wholeCommand.id
    this.params = wholeCommand.params as [string, ParamTypes][]

    const _direction = zclId.zclmeta.functional.getDirection(
      this.cluster,
      this.cmd
    )
    if (!_direction) {
      throw new Error("Unrecognized direction")
    }
    if (_direction !== (direction ? "serverToClient" : "clientToServer")) {
      throw new Error("Wrong direction")
    }
    this.direction = _direction
  }

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

const frameArg = <T extends ParamTypes>(
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
  args: { type: ParamTypes; value: any }[]
) => {
  for (const { type, value } of args) {
    frameArg(type, c, value)
  }
}
