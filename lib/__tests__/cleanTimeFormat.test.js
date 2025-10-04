import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { cleanTimeFormat } from '../pourReportService.js'

describe('cleanTimeFormat', () => {
  it('returns null for invalid AM/PM hour outside 1-12 range', () => {
    assert.equal(cleanTimeFormat('15:50 AM'), null)
    assert.equal(cleanTimeFormat('00:10 PM'), null)
  })

  it('normalizes valid AM/PM inputs', () => {
    assert.equal(cleanTimeFormat('1:05 AM'), '01:05:00')
    assert.equal(cleanTimeFormat('1:05 PM'), '13:05:00')
  })
})
