import test from 'node:test'
import assert from 'node:assert'
import { once } from 'node:events'

import * as utils from './utils'
import BACnetClient, { BACNetObjectID, BACNetAppData } from '../../src'

// you need to have this run against the official backstack c
// demo device started as deviceId 1234
// use "npm run docker" to execute this
test.describe('bacnet - write property compliance', () => {
	let bacnetClient: BACnetClient
	let discoveredAddress: any
	const onClose: ((callback: () => void) => void) | null = null

	function asyncReadProperty(
		address: string,
		objectId: BACNetObjectID,
		propertyId: number,
	): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			bacnetClient.readProperty(
				{ address },
				objectId,
				propertyId,
				(err, value) => {
					if (err) {
						reject(err)
					} else {
						resolve(value)
					}
				},
			)
		})
	}

	function asyncWriteProperty(
		address: string,
		objectId: BACNetObjectID,
		propertyId: number,
		values: BACNetAppData[],
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			bacnetClient.writeProperty(
				{ address },
				objectId,
				propertyId,
				values,
				{},
				(err) => {
					if (err) {
						reject(err)
					} else {
						resolve()
					}
				},
			)
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
		const value = await asyncReadProperty(
			discoveredAddress,
			{ type: 1, instance: 2 },
			85,
		)

		assert.ok(value, 'value should be an object')
	})

	test('write property PRESENT_VALUE from analog-output,2 from device', async () => {
		await asyncWriteProperty(
			discoveredAddress,
			{ type: 1, instance: 2 },
			85,
			[{ type: 4, value: 100 }],
		)
	})

	// TODO tests missing for routing cases where "receiver" parameter is used to call whoIs
})
