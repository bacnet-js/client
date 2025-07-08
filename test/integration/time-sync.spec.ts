import test from 'node:test'

import * as utils from './utils'

test.describe('bacnet - timeSync integration', () => {
	test('should send a time sync package', () => {
		const client = new utils.BacnetClient({ apduTimeout: 200 })
		client.timeSync({ address: '127.0.0.2' }, new Date())
		client.close()
	})
})
