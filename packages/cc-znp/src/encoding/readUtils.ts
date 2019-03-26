import { BufferWithPointer } from 'buffster';
export const readAddrString = (r: BufferWithPointer) => {
  if (r.remaining() < 8)
    throw new TypeError(
      `Expected Buffer of at least length 8, got ${r.remaining()}`
    );
  const hexBuf = r.buffer(8);
  hexBuf.reverse();
  return '0x' + hexBuf.toString('hex');
};
