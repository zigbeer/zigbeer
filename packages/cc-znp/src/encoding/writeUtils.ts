import { BufferBuilder } from 'buffster';
export const writeAddrString = (c: BufferBuilder, value: string) => {
  if (value.length !== 18)
    throw new TypeError(`Expected hex literal of length 18, got ${value}`);
  const hexBuf = Buffer.from(value.slice(2), 'hex');
  hexBuf.reverse();
  c.buffer(hexBuf);
};
