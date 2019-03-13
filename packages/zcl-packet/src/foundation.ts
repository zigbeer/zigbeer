import { BufferBuilder, BufferWithPointer } from "buffster"
import { readDataTable } from "./dataTypeRead"
import { writeDataTable } from "./dataTypeWrite"
import { getStdType } from "./definition"
import { specialReads } from "./foundationReads"
import { specialWrites } from "./foundationWrites"

interface AttrsArray<T> {
  write: (
    args: ReadonlyArray<T>
  ) => {
    readonly attrs: ReadonlyArray<T>
  }
  read: (data: { readonly attrs: ReadonlyArray<T> }) => ReadonlyArray<T>
}
type SpecAA<
  K extends keyof (typeof specialReads & typeof specialWrites)
> = AttrsArray<ReturnType<typeof specialReads[K]>>
const attrsArray: AttrsArray<unknown> = {
  write: <T>(args: ReadonlyArray<T>) =>
    ({
      attrs: args
    } as const),
  read: <T>({ attrs }: { readonly attrs: ReadonlyArray<T> }) => attrs
} as const
const compatabilityTable = {
  read: {
    write: (args: { attrId: number }[]) =>
      ({
        attrIds: args.map(x => x.attrId)
      } as const),
    read: (data: { attrIds: number[] }) =>
      data.attrIds.map(x => ({ attrId: x } as const))
  } as const,
  readRsp: attrsArray as SpecAA<"readRsp">,
  write: attrsArray as SpecAA<"write">,
  writeUndiv: attrsArray as SpecAA<"write">,
  writeRsp: attrsArray as SpecAA<"writeRsp">,
  writeNoRsp: attrsArray as SpecAA<"write">,
  configReport: attrsArray as SpecAA<"configReport">,
  configReportRsp: attrsArray as SpecAA<"configReportRsp">,
  readReportConfig: attrsArray as SpecAA<"readReportConfig">,
  readReportConfigRsp: attrsArray as SpecAA<"readReportConfigRsp">,
  report: attrsArray as SpecAA<"report">,
  readStruct: attrsArray as SpecAA<"readStruct">,
  writeStruct: attrsArray as SpecAA<"writeStruct">,
  writeStructRsp: attrsArray as SpecAA<"writeStructRsp">
} as const
type Inverse<F extends (arg: any) => any> = F extends (arg: infer A) => infer R
  ? (arg: R) => A
  : never
type Check = {
  [K in keyof typeof compatabilityTable]: {
    write: Inverse<typeof compatabilityTable[K]["read"]>
    read: Inverse<typeof compatabilityTable[K]["write"]>
  }
}
const compatabilityTableTypeCheck: Check = compatabilityTable

type Compat<K extends "read" | "write"> = <
  C extends string,
  A extends C extends keyof typeof compatabilityTable
    ? ArgsType<typeof compatabilityTable[C][K]>[0]
    : any
>(
  cmd: C,
  args: A
) => C extends keyof typeof compatabilityTable
  ? ReturnType<typeof compatabilityTable[C][K]>
  : A

const writeCompatabilityLayer: Compat<"write"> = (cmd, args) => {
  const type = compatabilityTable[cmd as string]
  if (type) return type.write(args)
  return args
}
const readCompatabilityLayer: Compat<"read"> = (cmd, args) => {
  const type = compatabilityTable[cmd as string]
  if (type) return type.read(args)
  return args
}

export class FoundPayload {
  constructor(
    private readonly params: [string, string][],
    public readonly cmdName: string,
    public readonly cmdId: number
  ) {}

  parse(r: BufferWithPointer) {
    const data: Record<string, any> = {}
    for (const [name, type] of this.params) {
      const fn = specialReads[type] || readDataTable[getStdType(type)]

      if (!fn) throw new Error(`No read function for ${type}`)

      data[name] = fn(r)
    }
    return readCompatabilityLayer(this.cmdName, data)
  }

  frame(c: BufferBuilder, payload: any) {
    const compPayload = writeCompatabilityLayer(this.cmdName, payload)
    if (typeof compPayload !== "object" || Array.isArray(compPayload))
      throw new TypeError(
        "Payload arguments of " + this.cmdName + " command should be an object"
      )
    for (const [name, type] of this.params) {
      if (compPayload[name] === undefined)
        throw new Error(
          `Payload of command: ${this.cmdName} must have property ${name}`
        )
      const fn = specialWrites[type] || writeDataTable[getStdType(type)]

      if (!fn) throw new Error(`No write function for ${type}`)

      fn(c, compPayload[name])
    }
  }
}
