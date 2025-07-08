import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - confirmedPrivateTransfer integration', () => {
	test('should return a timeout error if no device is available', (t) => {
		return new Promise((resolve) => {
			const client = new utils.BacnetClient({ apduTimeout: 200 })
			client.confirmedPrivateTransfer(
				{ address: '127.0.0.2' },
				0,
				8,
				[0x00, 0xaa, 0xfa, 0xb1, 0x00],
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
