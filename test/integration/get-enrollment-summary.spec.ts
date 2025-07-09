import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - getEnrollmentSummary integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
	  const client = new utils.BacnetClient({ apduTimeout: 200 })
    try {
      client.getEnrollmentSummary(
        { address: '127.0.0.2' },
        0,
        { notificationClassFilter: 5 },
      )
    } catch (err) { 
      assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()      
    }
	})
})
