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
  private fwd(dist: number): number {
    return this.goTo(this.pointer + dist)
  }
  uint8() {
    return this.buf.readUInt8(this.fwd(1))
  }
  uint16le() {
    return this.buf.readInt16LE(this.fwd(2))
  }
  buffer(length) {
    return this.buf.slice(this.fwd(length), this.pointer)
  }
  rest() {
    return this.buf.slice(this.goTo(this.len))
  }
  remaining() {
    return this.len - this.pointer
  }
}
