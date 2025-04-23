import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - removeListElement integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.removeListElement(
				'127.0.0.1',
				{ type: 19, instance: 100 },
				{ id: 80, index: 0 },
				[{ type: 1, value: true }],
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
