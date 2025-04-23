import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - createObject integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.createObject(
				'127.0.0.1',
				{ type: 2, instance: 300 },
				[
					{
						property: { id: 85, index: 1 },
						value: [{ type: 1, value: true }],
					},
				],
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
