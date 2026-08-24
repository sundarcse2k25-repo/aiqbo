const crypto = require('crypto');

if (!globalThis.crypto && crypto.webcrypto) {
  globalThis.crypto = crypto.webcrypto;
}
if (crypto.webcrypto) {
  if (!crypto.getRandomValues) {
    crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
  }
  if (!globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto);
  }
}
