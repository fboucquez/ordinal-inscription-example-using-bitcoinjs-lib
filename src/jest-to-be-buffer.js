expect.extend({
  toBeBuffer(receivedBuffer, expectedString) {
    const receivedString = receivedBuffer ? Buffer.from(receivedBuffer).toString('hex') : undefined
    const pass = receivedString === expectedString
    if (!pass) {
      expect(receivedString).toEqual(expectedString)
    }
    return {
      pass: pass,
      message: `Expected: ${expectedString} \n\nReceived: ${receivedString}`,
    }
  },
})
