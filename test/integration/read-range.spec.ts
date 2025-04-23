import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - readRange integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.readRange(
				'127.0.0.1',
				{ type: 20, instance: 0 },
				0,
				200,
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
