import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - writePropertyMultiple integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			const values = [
				{
					objectId: { type: 8, instance: 44301 },
					values: [
						{
							property: { id: 28, index: 12 },
							value: [{ type: 1, value: true }],
							priority: 8,
						},
					],
				},
			]
			client.writePropertyMultiple(
				{ address: '127.0.0.2' },
				values,
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
