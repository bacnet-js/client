import test from 'node:test'

import * as utils from './utils'

test.describe('bacnet - unconfirmedPrivateTransfer integration', () => {
	test('should correctly send a telegram', () => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		client.unconfirmedPrivateTransfer(
			{ address: '127.0.0.2' },
			0,
			7,
			[0x00, 0xaa, 0xfa, 0xb1, 0x00],
		)
		client.close()
	})
})
