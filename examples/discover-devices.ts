/**
 * This script will discover all devices in the network and print out their names
 *
 * After 30s the discovery is stopped automatically
 */

import Bacnet, {
	PropertyIdentifier,
	BACNetObjectID,
	ObjectType
} from '../src'

// create instance of Bacnet
const bacnetClient = new Bacnet({ apduTimeout: 10000, interface: '0.0.0.0' })

// emitted on errors
bacnetClient.on('error', (err: Error) => {
	console.error(err)
	bacnetClient.close()
})

// emitted when Bacnet server listens for incoming UDP packages
bacnetClient.on('listening', () => {
	console.log('discovering devices for 30 seconds ...')
	// discover devices once we are listening
	bacnetClient.whoIs({net: 0xffff});

	setTimeout(() => {
		bacnetClient.close()
		console.log(`closed transport ${Date.now()}`)
	}, 30000)
})

const knownDevices: number[] = []

// emitted when a new device is discovered in the network
bacnetClient.on('iAm', (device: any) => {
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
	if (knownDevices.includes(deviceId)) return

	const deviceObjectId: BACNetObjectID = { type: ObjectType.DEVICE, instance: deviceId }

	console.log('Starting read properties on ID ' + deviceId);

	bacnetClient.readProperty(
		address,
		deviceObjectId,
		PropertyIdentifier.OBJECT_NAME,
		{}
	).then 
	(
		function(result_OBJECT_NAME) 
		{
			bacnetClient.readProperty(
				address,
				deviceObjectId,
				PropertyIdentifier.VENDOR_NAME,
				{}
			).then
			(
				function(result_VENDOR_NAME) 
				{
					console.log(`OK Found Device ${deviceId} on ${JSON.stringify(address)}`);
					console.log(result_OBJECT_NAME);
					console.log(result_VENDOR_NAME);
				},
				function(error) 
				{
					console.log(`ERROR2 reading Device ${deviceId} on ${JSON.stringify(address)}`);
					console.log(error);
				}
			)
		},
  		function(error) 
		{
			console.log(`ERROR reading Device ${deviceId} on ${JSON.stringify(address)}`);
			console.log(error);
		}
	);

	knownDevices.push(deviceId)
})
