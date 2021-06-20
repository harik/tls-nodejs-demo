'use strict';

var tls = require('tls');
var fs = require('fs');
var net = require('net');

const USE_SSL = true;
const PORT = 1337;
const HOST = '127.0.0.1'

var pfx = process.argv.pop();
if (USE_SSL && !pfx.match(/[.]pfx$/)) {
    console.error("Usage: node device.js <device.pfx>");
    process.exit(2);
}

var options = {
    pfx: fs.readFileSync(pfx),
    checkServerIdentity: function (servername, cert) {
        //console.log(servername, cert);
        // Need to check servername matches with CN in cert, but since it will be 127.0.0.1 
        // we have nothing to do
        return null;
    },
    rejectUnauthorized: false   // <-- demo only
};

var client = (USE_SSL?tls:net).connect(PORT, HOST, options, function() {
    if (USE_SSL) {
        // Check if the authorization worked
        var cert = client.getPeerCertificate(true);
        console.log("Connected to ", cert.subject.CN, client.authorized?'✓ authorized':`!!UNAUTHORIZED!! ${client.authorizationError}`);
    } else
        console.log("Connected (unsecured)");
    // Send a friendly message
    client.write("hello");

});

client.on("data", function(data) {

    console.log('Received [%d bytes]: %s',
        data.length,
        data.toString().replace(/(\n)/gm,""));

    // Close the connection after receiving the message
    client.end();

});

client.on('close', () => console.log("Connection closed"));

// When an error ocoures, show it.
client.on('error', function(error) {
    console.error(error);
    client.destroy();
});

