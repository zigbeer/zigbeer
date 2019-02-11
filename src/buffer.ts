type Encoding = "utf8" | "latin1"
export class BufferWithPointer {
  public pointer = 0
  constructor(private buf: Buffer) {}
  private len = this.buf.length

  /**
   * Sets the buffer pointer, the address at which next parse will begin.
   * @throws {RangeError} if this will put pointer outside of `0..=len` range.
   * @param {number} addr What index to go to
   * @returns {number} the previous pointer, before setting
   */
  private goTo(addr: number): number {
    const { pointer, len } = this
    const newPointer = addr
    if (newPointer > len) throw new RangeError("Index past Buffer end")
    if (newPointer < 0) throw new RangeError("Index before Buffer beginning")
    this.pointer = newPointer
    return pointer
  }
  /**
   * Increments the buffer pointer, the address at which next parse will begin.
   * @throws {RangeError} if this will put pointer outside of `0..=len` range.
   * @param {number} dist How far to wind the buffer pointer. Can be negative to rewind and overwrite.
   * @returns {number} the previous pointer, before winding
   */
  fwd(dist: number): number {
    return this.goTo(this.pointer + dist)
  }
  uint8() {
    return this.buf.readUInt8(this.fwd(1))
  }
  int8() {
    return this.buf.readInt8(this.fwd(1))
  }
  uint16le() {
    return this.buf.readUInt16LE(this.fwd(2))
  }
  int16le() {
    return this.buf.readInt16LE(this.fwd(2))
  }
  uint32le() {
    return this.buf.readUInt32LE(this.fwd(4))
  }
  int32le() {
    return this.buf.readInt32LE(this.fwd(4))
  }
  floatle() {
    return this.buf.readFloatLE(this.fwd(4))
  }
  doublele() {
    return this.buf.readDoubleLE(this.fwd(8))
  }
  uintle(length: number) {
    return this.buf.readUIntLE(this.fwd(length), length)
  }
  intle(length: number) {
    return this.buf.readIntLE(this.fwd(length), length)
  }
  slice(length: number) {
    return this.buf.slice(this.fwd(length), this.pointer)
  }
  buffer(length: number) {
    // has to come first so we don't allocate on error
    const start = this.fwd(length)
    const newBuf = Buffer.allocUnsafe(length)
    this.buf.copy(newBuf, 0, start, this.pointer)
    return newBuf
  }
  string(length: number, encoding: Encoding) {
    return this.buf.toString(encoding, this.fwd(length), this.pointer)
  }
  rest() {
    return this.buf.slice(this.goTo(this.len))
  }
  remaining() {
    return this.len - this.pointer
  }
}

type Args<T extends (...args: any[]) => any> = T extends (
  ...args: infer U
) => any
  ? U
  : never

type Task =
  | ["copy", Buffer]
  | ["write", string, Encoding]
  | ["writeUIntLE" | "writeIntLE", number, number]
  | [

        | "writeUInt8"
        | "writeUInt16LE"
        | "writeUInt32LE"
        | "writeInt8"
        | "writeInt16LE"
        | "writeInt32LE"
        | "writeFloatLE"
        | "writeDoubleLE",
      number
    ]

export class BufferBuilder {
  private tasks: Task[] = []
  private len = 0
  int8(value: number): this {
    this.tasks.push(["writeInt8", value])
    this.len += 1
    return this
  }
  uint8(value: number): this {
    this.tasks.push(["writeUInt8", value])
    this.len += 1
    return this
  }
  int16le(value: number): this {
    this.tasks.push(["writeInt16LE", value])
    this.len += 2
    return this
  }
  uint16le(value: number): this {
    this.tasks.push(["writeUInt16LE", value])
    this.len += 2
    return this
  }
  int32le(value: number): this {
    this.tasks.push(["writeInt32LE", value])
    this.len += 4
    return this
  }
  uint32le(value: number): this {
    this.tasks.push(["writeUInt32LE", value])
    this.len += 4
    return this
  }
  floatle(value: number): this {
    this.tasks.push(["writeFloatLE", value])
    this.len += 4
    return this
  }
  doublele(value: number): this {
    this.tasks.push(["writeDoubleLE", value])
    this.len += 8
    return this
  }
  intle(value: number, length: number): this {
    this.tasks.push(["writeIntLE", value, length])
    this.len += length
    return this
  }
  uintle(value: number, length: number): this {
    this.tasks.push(["writeUIntLE", value, length])
    this.len += length
    return this
  }
  string(value: string, encoding: Encoding): this {
    this.tasks.push(["write", value, encoding])
    this.len += Buffer.byteLength(value, encoding)
    return this
  }
  buffer(data: Buffer): this {
    const { length } = data
    const buf = Buffer.allocUnsafe(length)
    data.copy(buf)
    this.tasks.push(["copy", buf])
    this.len += length
    return this
  }
  result(): Buffer {
    const buf = Buffer.allocUnsafe(this.len)
    let pointer = 0
    for (const task of this.tasks) {
      switch (task[0]) {
        case "copy": {
          const toCopy = task[1]
          pointer += toCopy.copy(buf, pointer)
          continue
        }
        case "write": {
          const [, string, encoding] = task
          pointer += (buf.write as (
            string: Args<typeof buf.write>[0],
            offset: Args<typeof buf.write>[1],
            encoding: Args<typeof buf.write>[3]
          ) => number)(string, pointer, encoding)
          continue
        }
        case "writeUIntLE":
        case "writeIntLE": {
          const [method, number, bytelength] = task
          pointer = buf[method](number, pointer, bytelength)
          continue
        }
        default: {
          const [method, number] = task
          pointer = buf[method](number, pointer)
          continue
        }
      }
    }
    return buf
  }
}
