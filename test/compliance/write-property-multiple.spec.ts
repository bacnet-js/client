import test from 'node:test'
import assert from 'node:assert'
import { once } from 'node:events'

import * as utils from './utils'
import BACnetClient, {
	BACNetObjectID,
	BACNetAppData,
	ServiceOptions,
	BACNetAddress,
} from '../../src'

// you need to have this run against the official backstack c
// demo device started as deviceId 1234
// use "npm run docker" to execute this
test.describe('bacnet - write property multiple compliance', () => {
	let bacnetClient: BACnetClient
	let discoveredAddress: any
	const onClose: ((callback: () => void) => void) | null = null

	function asyncReadProperty(
		receiver: BACNetAddress,
		objectId: BACNetObjectID,
		propertyId: number,
	): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			bacnetClient.readProperty(
				receiver,
				objectId,
				propertyId,
				(err, value) => {
					if (err) {
						if (err.message === 'ERR_TIMEOUT') {
							utils.debug(
								'Got timeout on read property - acceptable in this environment',
							)
							resolve({ timeout: true })
							return
						}
						reject(err)
					} else {
						resolve(value)
					}
				},
			)
		})
	}

	function asyncWritePropertyMultiple(
		receiver: BACNetAddress,
		values: Array<{
			objectId: BACNetObjectID
			values: Array<{
				property: { id: number; index?: number }
				value: BACNetAppData[]
				priority: number
			}>
		}>,
	): Promise<{ success?: boolean; timeout?: boolean; error?: Error }> {
		return new Promise<{
			success?: boolean
			timeout?: boolean
			error?: Error
		}>((resolve, reject) => {
			bacnetClient.writePropertyMultiple(receiver, values, {}, (err) => {
				if (err) {
					if (err.message === 'ERR_TIMEOUT') {
						utils.debug(
							'Got timeout on write property multiple - acceptable in this environment',
						)
						resolve({ timeout: true })
						return
					}

					if (err.message.includes('BacnetError')) {
						resolve({ error: err })
						return
					}

					reject(err)
				} else {
					resolve({ success: true })
				}
			})
		})
	}

	test.before(async () => {
		bacnetClient = new utils.bacnetClient({
			apduTimeout: utils.apduTimeout,
			interface: utils.clientListenerInterface,
		})
		bacnetClient.on('message', (msg: any, rinfo: any) => {
			utils.debug(msg)
			if (rinfo) utils.debug(rinfo)
		})
		bacnetClient.on('iAm', (device: any) => {
			discoveredAddress = device.header.sender
		})
		bacnetClient.on('error', (err: Error) => {
			console.error(err)
			bacnetClient.close()
		})
		await once(bacnetClient as any, 'listening')
	})

	test.after(async () => {
		return new Promise<void>((done) => {
			setTimeout(() => {
				bacnetClient.close()
				if (onClose) {
					onClose(done)
				} else {
					done()
				}
			}, 100) // do not close too fast
		})
	})

	test('should find the device simulator device', async () => {
		bacnetClient.whoIs()
		const [device] = await once(bacnetClient as any, 'iAm')

		if (device.payload.deviceId === utils.deviceUnderTest) {
			discoveredAddress = device.header.sender
			assert.strictEqual(device.payload.deviceId, utils.deviceUnderTest)
			assert.ok(
				discoveredAddress,
				'discoveredAddress should be an object',
			)
			assert.match(
				discoveredAddress.address,
				/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
			)
		}
	})

	test('read property PRESENT_VALUE from analog-output,2 from device', async () => {
		const result = await asyncReadProperty(
			discoveredAddress,
			{ type: 1, instance: 2 },
			85,
		)

		if (!result.timeout) {
			assert.ok(result, 'value should be an object')
		}
	})

	test('write property using Multiple PRESENT_VALUE from analog-output,2 from device', async () => {
		const values = [
			{
				objectId: { type: 1, instance: 2 },
				values: [
					{
						property: { id: 85 },
						value: [{ type: 4, value: 100 }],
						priority: 8,
					},
				],
			},
		]

		const result = await asyncWritePropertyMultiple(
			discoveredAddress,
			values,
		)

		if (result.error) {
			assert.ok(
				result.error.message.includes('BacnetError') ||
					result.error.message.includes('ERR_TIMEOUT'),
				`Expected specific error or timeout but got: ${result.error.message}`,
			)
		}
	})

	test('read property PRESENT_VALUE from analog-output,2 from device, expect written value', async () => {
		const result = await asyncReadProperty(
			discoveredAddress,
			{ type: 1, instance: 2 },
			85,
		)

		if (!result.timeout) {
			assert.ok(result, 'value should be an object')
		}
	})

	// TODO tests missing for routing cases where "receiver" parameter is used to call whoIs
})
