module.exports = class MockObjectbox {
  find(predicate) {}
  get(id) {
    throw new Error("Not Implemented") // this is used in the code but no tests hit it?
  }
  sync(id, callback) {
    throw new Error("Not Implemented") // this is used in the code but no tests hit it?
    setImmediate(callback)
  }
  remove(id, callback) {
    throw new Error("Not Implemented") // this is used in the code but no tests hit it?
    setImmediate(callback)
  }
  exportAllObjs() {
    throw new Error("Not Implemented") // this is used in the code but no tests hit it?
    return []
  }
}
