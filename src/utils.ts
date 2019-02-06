import Concentrate = require("concentrate")
export const buf2Str = (buf: Buffer) => {
  const bufLen = buf.length
  let strChunk = "0x"

  for (let i = 0; i < bufLen; i += 1) {
    const val = buf.readUInt8(bufLen - i - 1)
    if (val <= 15) {
      strChunk += "0" + val.toString(16)
    } else {
      strChunk += val.toString(16)
    }
  }

  return strChunk
}
export const writeUInt64 = (c: Concentrate, hexString: string) => {
  if (typeof hexString !== "string" || hexString.length !== 18)
    throw new Error("Invalid hexstring format")
  const msb = parseInt(hexString.slice(2, 10), 16)
  const lsb = parseInt(hexString.slice(10), 16)
  c.uint32le(lsb).uint32le(msb)
}

type Cancellable<T> = Promise<T> & { cancel(): void }
export const timeout = (ms: number) => {
  let timeout: NodeJS.Timeout
  let cancel: (reason?: any) => void
  const promise = new Promise((resolve, reject) => {
    timeout = setTimeout(resolve, ms)
    cancel = reject
  }) as Cancellable<undefined>
  promise.cancel = () => {
    clearTimeout(timeout)
    cancel(new Error("Cancelled"))
  }
  return promise
}
