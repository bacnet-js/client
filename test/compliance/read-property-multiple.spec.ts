import test from 'node:test'
import assert from 'node:assert'

import * as utils from './utils'
import { once } from 'node:events'
import BACnetClient, {
	ASN1_ARRAY_ALL,
	BACNetAddress,
	BACNetReadAccessSpecification,
	DecodeAcknowledgeMultipleResult,
} from '../../src'

// you need to have this run against the official backstack c
// demo device started as deviceId 1234
// use "npm run docker" to execute this
test.describe('bacnet - read property multiple compliance', () => {
	let bacnetClient: BACnetClient
	let discoveredAddress: BACNetAddress
	const onClose: ((callback: () => void) => void) | null = null

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

	test('read all properties from invalid device, expect errors in response', async () => {
		// Read complete Device Object
		const requestArray: BACNetReadAccessSpecification[] = [
			{
				objectId: { type: 8, instance: utils.deviceUnderTest + 1 },
				properties: [{ index: ASN1_ARRAY_ALL, id: 8 }],
			},
		]

		try {
			await bacnetClient.readPropertyMultiple(
				discoveredAddress,
				requestArray,
				{},
			)
			assert.fail('Expected an error but got none')
		} catch (err: any) {
			assert.ok(err, 'Error should be present')
			assert.ok(
				err.message.includes('BacnetError'),
				`Error message should include BacnetError, got: ${err.message}`,
			)
		}
	})

	test('read all properties from device, use discovered device address object', async () => {
		// Read complete Device Object
		const requestArray = [
			{
				objectId: { type: 8, instance: utils.deviceUnderTest },
				properties: [{ index: ASN1_ARRAY_ALL, id: 8 }],
			},
		]
		const value = await bacnetClient.readPropertyMultiple(
			discoveredAddress,
			requestArray,
			{},
		)

		assert.ok(value, 'value should be an object')
		assert.ok(
			Array.isArray(value.values),
			'value.values should be an array',
		)
		assert.ok(value.values[0], 'value.values[0] should be an object')
		assert.deepStrictEqual(value.values[0].objectId, {
			type: 8,
			instance: utils.deviceUnderTest,
		})
		assert.ok(
			Array.isArray(value.values[0].values),
			'value.values[0].values should be an array',
		)

		const prop75 = value.values[0].values.find((v) => v.id === 75)
		assert.ok(prop75, 'Should have property with ID 75')
		assert.deepStrictEqual(prop75.value[0], {
			len: 5,
			value: {
				type: 8,
				instance: utils.deviceUnderTest,
			},
			type: 12,
		})
	})

	test('read all properties from device, use discovered device address as IP', async () => {
		// Read complete Device Object
		const requestArray = [
			{
				objectId: { type: 8, instance: utils.deviceUnderTest },
				properties: [{ index: ASN1_ARRAY_ALL, id: 8 }],
			},
		]
		const value = await bacnetClient.readPropertyMultiple(
			discoveredAddress,
			requestArray,
			{},
		)

		assert.ok(value, 'value should be an object')
		assert.ok(
			Array.isArray(value.values),
			'value.values should be an array',
		)
		assert.ok(value.values[0], 'value.values[0] should be an object')
		assert.deepStrictEqual(value.values[0].objectId, {
			type: 8,
			instance: utils.deviceUnderTest,
		})
		assert.ok(
			Array.isArray(value.values[0].values),
			'value.values[0].values should be an array',
		)

		const prop75 = value.values[0].values.find((v) => v.id === 75)
		assert.ok(prop75, 'Should have property with ID 75')
		assert.deepStrictEqual(prop75.value[0], {
			len: 5,
			value: {
				type: 8,
				instance: utils.deviceUnderTest,
			},
			type: 12,
		})
	})

	test(
		'read all properties from analog-output,2 of simulator device',
		{ timeout: 15000 },
		async () => {
			// Read complete Device Object
			const requestArray = [
				{
					objectId: { type: 1, instance: 2 },
					properties: [{ index: ASN1_ARRAY_ALL, id: 8 }],
				},
			]
			const value = await bacnetClient.readPropertyMultiple(
				discoveredAddress,
				requestArray,
				{},
			)

			assert.ok(value, 'value should be an object')
			assert.ok(
				Array.isArray(value.values),
				'value.values should be an array',
			)
			assert.ok(value.values[0], 'value.values[0] should be an object')
			assert.deepStrictEqual(value.values[0].objectId, {
				type: 1,
				instance: 2,
			})
			assert.ok(
				Array.isArray(value.values[0].values),
				'value.values[0].values should be an array',
			)

			const prop75 = value.values[0].values.find((v) => v.id === 75)
			assert.ok(prop75, 'Should have property with ID 75')
			assert.deepStrictEqual(prop75.value[0], {
				len: 5,
				value: {
					type: 1,
					instance: 2,
				},
				type: 12,
			})

			const prop77 = value.values[0].values.find((v) => v.id === 77)
			assert.ok(prop77, 'Should have property with ID 77')
			assert.deepStrictEqual(prop77.value[0], {
				len: 18,
				value: 'ANALOG OUTPUT 2',
				type: 7,
				encoding: 0,
			})
		},
	)

	test(
		'read all properties from device, use broadcast',
		{ timeout: 15000 },
		async () => {
			// Read complete Device Object
			const requestArray = [
				{
					objectId: { type: 8, instance: utils.deviceUnderTest },
					properties: [{ index: ASN1_ARRAY_ALL, id: 8 }],
				},
			]
			const value = await bacnetClient.readPropertyMultiple(
				null,
				requestArray,
				{},
			)

			assert.ok(value, 'value should be an object')
			assert.ok(
				Array.isArray(value.values),
				'value.values should be an array',
			)
			assert.ok(value.values[0], 'value.values[0] should be an object')
			assert.deepStrictEqual(value.values[0].objectId, {
				type: 8,
				instance: utils.deviceUnderTest,
			})
			assert.ok(
				Array.isArray(value.values[0].values),
				'value.values[0].values should be an array',
			)

			const prop75 = value.values[0].values.find((v) => v.id === 75)
			assert.ok(prop75, 'Should have property with ID 75')
			assert.deepStrictEqual(prop75.value[0], {
				len: 5,
				value: {
					type: 8,
					instance: utils.deviceUnderTest,
				},
				type: 12,
			})
		},
	)

	// TODO tests missing for routing cases where "receiver" parameter is used to call whoIs
})
