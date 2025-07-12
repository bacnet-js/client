import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'

test.describe('bacnet - confirmedPrivateTransfer integration', () => {
	test('should return a timeout error if no device is available', async (t) => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		try {
			await client.confirmedPrivateTransfer(
				{ address: '127.0.0.2' },
				0,
				8,
				[0x00, 0xaa, 0xfa, 0xb1, 0x00],
				{},
			)
		} catch (err) {
			assert.strictEqual((err as Error).message, 'ERR_TIMEOUT')
			client.close()
		}
	})
})
