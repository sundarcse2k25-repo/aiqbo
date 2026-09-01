import { describe, it, expect } from 'vitest'
import { Router } from '../router'

describe('Router', () => {
  it('matches a registered GET route by method and exact path', () => {
    const router = new Router()
    const handler = () => {}
    router.get('/api/health', handler)
    expect(router.match('GET', '/api/health')).toBe(handler)
  })

  it('matches a registered POST route independently of a same-path GET route', () => {
    const router = new Router()
    const getHandler = () => {}
    const postHandler = () => {}
    router.get('/api/qbo/status', getHandler)
    router.post('/api/qbo/status', postHandler)
    expect(router.match('GET', '/api/qbo/status')).toBe(getHandler)
    expect(router.match('POST', '/api/qbo/status')).toBe(postHandler)
  })

  it('returns undefined for an unmatched path', () => {
    const router = new Router()
    router.get('/api/health', () => {})
    expect(router.match('GET', '/api/does-not-exist')).toBeUndefined()
  })

  it('returns undefined for a matched path with the wrong method', () => {
    const router = new Router()
    router.get('/api/health', () => {})
    expect(router.match('POST', '/api/health')).toBeUndefined()
  })
})
