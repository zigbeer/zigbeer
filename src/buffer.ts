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
  uint24le() {
    return this.buf.readUIntLE(this.fwd(3), 3)
  }
  int24le() {
    return this.buf.readIntLE(this.fwd(3), 3)
  }
  uint32le() {
    return this.buf.readUInt32LE(this.fwd(4))
  }
  int32le() {
    return this.buf.readInt32LE(this.fwd(4))
  }
  uint40le() {
    return this.buf.readUIntLE(this.fwd(5), 5)
  }
  int40le() {
    return this.buf.readIntLE(this.fwd(5), 5)
  }
  uint48le() {
    return this.buf.readUIntLE(this.fwd(6), 6)
  }
  int48le() {
    return this.buf.readIntLE(this.fwd(6), 6)
  }
  uint56le() {
    return this.buffer(7)
  }
  int56le() {
    return this.buffer(7)
  }
  uint64le() {
    return this.buffer(8)
  }
  int64le() {
    return this.buffer(8)
  }
  floatle() {
    return this.buf.readFloatLE(this.fwd(4))
  }
  doublele() {
    return this.buf.readDoubleLE(this.fwd(8))
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
  string(length: number, encoding: "latin1" | "utf8") {
    return this.buf.toString(encoding, this.fwd(length), this.pointer)
  }
  rest() {
    return this.buf.slice(this.goTo(this.len))
  }
  remaining() {
    return this.len - this.pointer
  }
}
