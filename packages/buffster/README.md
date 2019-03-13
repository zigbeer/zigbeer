# Buffster

A dead-simple wrapper for building and reading nodejs `Buffer`s

[![NPM](https://nodei.co/npm/buffster.png?downloads=true)](https://nodei.co/npm/buffster/)

## Installation

```sh
pnpm i buffster
```

## Usage

```ts
import { BufferBuilder, BufferWithPointer } from "buffster"

const c = new BufferBuilder()
// methods are fluent, but mutate the builder
c.uint8(6).string("hello", "utf8")
const buf = c.result()
console.log(buf) // <Buffer 06 68 65 6c 6c 6f>

const r = new BufferWithPointer(buf)
console.log(r.uint8()) // 6
console.log(r.string(r.remaining())) // hello
console.log(r.remaining()) // 0
```
