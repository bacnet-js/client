import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - reinitializeDevice integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.reinitializeDevice(
				'127.0.0.2',
				1,
				{ password: 'Test1234' },
				(err) => {
					assert.strictEqual(err.message, 'ERR_TIMEOUT')
					client.close()
					resolve()
				},
			)
		})
	})
})
