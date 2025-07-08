import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - subscribeProperty integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.subscribeProperty(
				{ address: '127.0.0.2' },
				{ type: 5, instance: 33 },
				{ id: 80, index: 0 },
				8,
				false,
				false,
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
