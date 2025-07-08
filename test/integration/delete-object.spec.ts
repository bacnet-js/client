import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - deleteObject integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.deleteObject(
				{ address: '127.0.0.2' },
				{ type: 2, instance: 15 },
				{},
				(err) => {
					assert.strictEqual(err.message, 'ERR_TIMEOUT')
					client.close()
					resolve()
				},
			)
		})
	})
})
