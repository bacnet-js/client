import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - getEnrollmentSummary integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.getEnrollmentSummary(
				{ address: '127.0.0.2' },
				0,
				{ notificationClassFilter: 5 },
				(err, value) => {
					assert.strictEqual(err.message, 'ERR_TIMEOUT')
					assert.strictEqual(value, undefined)
					client.close()
					resolve()
				},
			)
		})
	})
})
