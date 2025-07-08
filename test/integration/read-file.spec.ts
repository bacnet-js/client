import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - readFile integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.readFile(
				{ address: '127.0.0.2' },
				{ type: 10, instance: 100 },
				0,
				100,
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
