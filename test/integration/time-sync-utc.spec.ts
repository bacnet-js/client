import test from 'node:test'

import * as utils from './utils'

test.describe('bacnet - timeSyncUTC integration', () => {
	test('should send a time UTC sync package', () => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		client.timeSyncUTC({ address: '127.0.0.2' }, new Date())
		client.close()
	})
})
