import { describe, it, expect } from 'vitest'
import { DefaultQBOProvider } from '../QBOProvider'
import { readConfig } from '../../../config/env'

describe('DefaultQBOProvider', () => {
  it('can be instantiated without real QBO credentials', () => {
    expect(() => new DefaultQBOProvider(readConfig({}))).not.toThrow()
  })

  it('isConfigured() reflects whether QBO credentials are present, without needing them to run', () => {
    const unconfigured = new DefaultQBOProvider(readConfig({}))
    expect(unconfigured.isConfigured()).toBe(false)

    const configured = new DefaultQBOProvider(
      readConfig({ QBO_CLIENT_ID: 'a', QBO_CLIENT_SECRET: 'b', QBO_REDIRECT_URI: 'c' }),
    )
    expect(configured.isConfigured()).toBe(true)
  })
})
