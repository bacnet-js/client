import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - readProperty integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.readProperty(
				'127.0.0.2',
				{ type: 8, instance: 44301 },
				28,
				{},
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
