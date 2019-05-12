var util = require("util");
var AWS = require("aws-sdk");
var iot = new AWS.Iot();

exports.handler = async (event) => {
 
    try {
        console.log(`Received event:\n${util.inspect(event)}`);

        var thing = event.thing;
        thing.thingName = thing.deviceType + '-' + thing.serialNumber;

        var thingExistsResponse = await thingExists(thing.thingName);

        if (thingExistsResponse.doesExist) {
            thing.version = thingExistsResponse.version;
            var updateThingResponse = await updateThing(thing);
            const response = {
                statusCode: 200,
                message: 'Existing thing updated.'
            };
            return response;
        } else {
            var createThingResponse = await createThing(thing);
            const response = {
                statusCode: 200,
                message: 'New thing created.',
                thingName: createThingResponse.thingName,
                thingArn: createThingResponse.thingArn,
                thingId: createThingResponse.thingId
            };
            return response;
        }
    } catch (err) {
        console.log(`Error:\n${err}`);
        const response = {
            statusCode: 500,
            message: err
        };
        return response;
    }
};

async function updateThing(thing) {
    console.log("Updating thing...");
    var params = {
        thingName: thing.thingName,
        attributePayload: {
            attributes: {
                'serial-number': thing.serialNumber,
                'device-type': thing.deviceType
            },
            merge: false
        },
        expectedVersion: thing.version
    };
        
    var updateThingResponse = await iot.updateThing(params).promise();
    console.log(`Thing updated!`);
    return updateThingResponse;
}

async function thingExists(thingName) {
    
    try {
        var params = {
            thingName: thingName
        };
        var describeThingResponse = await iot.describeThing(params).promise();
        console.log(`Thing ${thingName} already exists...`);
        return {
            doesExist: true,
            version: describeThingResponse.version
        };
    } catch (err) {

        console.log(`Error: ${err}`);
        return {
            doesExist: false
        };
    }
    
}


async function createThing(thing) {

    /*
        thing:
            serialNumber: '0000001'
            deviceType: 'tempest'
    */

    var params = {
        thingName: thing.thingName,
        attributePayload: {
            attributes: {
                'serial-number': thing.serialNumber,
                'device-type': thing.deviceType
          }
        }
    };
    console.log('Calling iot.createThing()...');
    var createThingResponse = await iot.createThing(params).promise();
    return createThingResponse;
}