/**
 * This script will discover the devices and tries to register a COV for ANALOG_INPUT 0
 * The script works very well when the Yabe Room Simulator exe is running
 *
 * After 20s the subscription is cancelled by updating it with a lifetime of 1s
 */

import Bacnet, { BACNetObjectID, ServiceOptions } from '../src/index'

// you need to run the Weather2 Station of the YABE BACnet package
// https://sourceforge.net/projects/yetanotherbacnetexplorer/

// create instance of Bacnet
// Use port 47809 to avoid conflict with emulator on 47808
const bacnetClient = new Bacnet({
	apduTimeout: 10000,
	interface: '0.0.0.0',
	port: 47809,
})

// emitted for each new message
bacnetClient.on('message', (msg: any, rinfo: any) => {
	console.log(msg)
	if (rinfo) console.log(rinfo)
})

// emitted on errors
bacnetClient.on('error', (err: Error) => {
	console.error(err)
	bacnetClient.close()
})

// emmitted when Bacnet server listens for incoming UDP packages
bacnetClient.on('listening', () => {
	console.log(`sent whoIs ${Date.now()}`)
	// discover devices once we are listening
	bacnetClient.whoIs()
})

// emitted when "Change of object" Messages are coming in
bacnetClient.on('covNotifyUnconfirmed', (data: any) => {
	console.log(`Received COV: ${JSON.stringify(data)}`)
})

// emitted when a new device is discovered in the network
bacnetClient.on('iAm', async (device: any) => {
	console.log(`Received iAm: ${JSON.stringify(device, null, 4)}`)

	// Make sure device has the expected structure
	if (!device.header || !device.payload) {
		console.log('Received invalid device information')
		return
	}

	// address object of discovered device,
	// just use in subsequent calls that are directed to this device
	const address = device.header.sender

	//discovered device ID
	const deviceId = device.payload.deviceId
	console.log(`Found Device ${deviceId} on ${JSON.stringify(address)}`)

	// Define object ID for analog input 0
	const analogInput: BACNetObjectID = { type: 0, instance: 0 }

	// Options for service calls
	const options: ServiceOptions = {
		maxSegments: 0,
		maxApdu: 0,
	}

	try {
		// Subscribe changes for PRESENT_VALUE of ANALOG_INPUT,0 object
		// lifetime 0 means "for ever"
		await bacnetClient.subscribeCov(
			address,
			analogInput,
			85,
			false,
			false,
			0,
			options,
		)
		console.log('subscribeCOV successful')
	} catch (err) {
		console.log(`subscribeCOV failed: ${err}`)
	}

	// after 20s re-subscribe but with 1s lifetime to stop it
	// I had issues with "cancel" call with the simulated device
	setTimeout(async () => {
		try {
			await bacnetClient.subscribeCov(
				address,
				analogInput,
				85,
				false,
				false,
				1,
				options,
			)
			console.log('UnsubscribeCOV successful')
		} catch (err) {
			console.log(`UnsubscribeCOV failed: ${err}`)
		}
	}, 20000)
})

// after 30s end the connection
setTimeout(() => {
	bacnetClient.close()
	console.log(`closed transport ${Date.now()}`)
}, 30000) // do not close too fast
