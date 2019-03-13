import { BufferBuilder, BufferWithPointer } from "./index"
const emptyBuf = Buffer.alloc(0)

describe("should write and read back", () => {
  const nums = [
    ["int8", 0x7f, -0x80],
    ["uint8", 0xfe, 0],
    ["int16le", 0x7fef, -0x8000],
    ["uint16le", 0xfefe, 0],
    ["int32le", 0x7fefefef, -0x80000000],
    ["uint32le", 0xfefefefe, 0],
    ["doublele", 1 / 0x100, 0],
    ["floatle", 1 / 0x100, 0]
  ] as const
  type Nums = [
    typeof nums[number][0],
    typeof nums[number][1],
    typeof nums[number][2]
  ][]
  it.each((nums as unknown) as Nums)("%s number", (name, one, two) => {
    const c = new BufferBuilder()
    c[name](one)[name](two)
    const buf = c.result()
    expect(buf).toMatchSnapshot()
    const r = new BufferWithPointer(buf)
    expect(r[name]()).toBe(one)
    expect(r[name]()).toBe(two)
    expect(r.remaining()).toBe(0)
    expect(r.rest().equals(emptyBuf)).toBe(true)
  })
  const weirdNums = [
    ["uintle", 0xfefefe, 0xfdfdfdfdfdfd],
    ["intle", -0x800000, -0x800000000000]
  ] as const
  type WeirdNums = [
    typeof weirdNums[number][0],
    typeof weirdNums[number][1],
    typeof weirdNums[number][2]
  ][]
  it.each((weirdNums as unknown) as WeirdNums)(
    "custom %s number",
    (name, one, two) => {
      const c = new BufferBuilder()
      c[name](one, 3)[name](two, 6)
      const buf = c.result()
      expect(buf).toMatchSnapshot()
      const r = new BufferWithPointer(buf)
      expect(r[name](3)).toBe(one)
      expect(r[name](6)).toBe(two)
      expect(r.remaining()).toBe(0)
      expect(r.rest().equals(emptyBuf)).toBe(true)
    }
  )

  it("string", () => {
    const c = new BufferBuilder()
    const one = "ਟੈਸਟ"
    const two = "ÿ"
    const three = "امتحان"
    const l1 = c.string(one, "utf8").result().length
    const l2 = c.string(two, "latin1").result().length
    c.string(three, "utf8")
    const buf = c.result()
    expect(buf).toMatchInlineSnapshot(`
Buffer<
  e0 a8 9f e0 a9 88 e0 a8 b8 e0 a8 9f ff d8 a7 d9 85 d8 aa d8 ad d8 a7 d9 86
>
`)
    const r = new BufferWithPointer(buf)
    expect(r.string(l1, "utf8")).toBe(one)
    expect(r.string(l2 - l1, "latin1")).toBe(two)
    expect(r.string(buf.length - l2, "utf8")).toBe(three)
    expect(r.remaining()).toBe(0)
    expect(r.rest().equals(emptyBuf)).toBe(true)
  })

  it("buffer", () => {
    const c = new BufferBuilder()
    const one = Buffer.from("aabbccddeeff", "hex")
    const two = Buffer.from("abcdef", "hex")
    c.buffer(one)
    c.buffer(two)
    const buf = c.result()
    expect(buf).toMatchInlineSnapshot(`Buffer<aa bb cc dd ee ff ab cd ef>`)
    const r = new BufferWithPointer(buf)
    expect(r.buffer(one.length).equals(one)).toBe(true)
    expect(r.buffer(two.length).equals(two)).toBe(true)
    expect(r.remaining()).toBe(0)
    expect(r.rest().equals(emptyBuf)).toBe(true)
  })
})

describe("slice vs buffer", () => {
  it("slice should reference the buffer", () => {
    const buf = Buffer.alloc(4)
    const r = new BufferWithPointer(buf)
    const slice = r.slice(4)
    slice.write("ff", "hex")
    expect(buf[0]).toBe(0xff)
  })

  it("buffer shouldn't reference the buffer", () => {
    const buf = Buffer.alloc(4)
    const r = new BufferWithPointer(buf)
    const buffer = r.buffer(4)
    buffer.write("ff", "hex")
    expect(buf[0]).toBe(0)
  })
})

describe("errors", () => {
  it("should give descriptive error when going out of bounds", () => {
    const r = new BufferWithPointer(emptyBuf)
    expect(() => r.uint8()).toThrowErrorMatchingInlineSnapshot(
      `"Index past Buffer end"`
    )
    expect(() => r.buffer(1)).toThrowErrorMatchingInlineSnapshot(
      `"Index past Buffer end"`
    )
    expect(() => r.string(1, "utf8")).toThrowErrorMatchingInlineSnapshot(
      `"Index past Buffer end"`
    )
    expect(() => r.fwd(-1)).toThrowErrorMatchingInlineSnapshot(
      `"Index before Buffer beginning"`
    )
  })
  it("should return 0 length string", () => {
    const r = new BufferWithPointer(emptyBuf)
    expect(r.string(0, "utf8")).toBe("")
  })
})
