'use strict';

var tls = require('tls');
var fs = require('fs');

const PORT = 1338;
const HOST = '127.0.0.1'

var args = {
    //key: 'device-eec9fc85-pvt-key.pem',
    //cert: 'device-eec9fc85-cert.pem',
    pfx: 'device-eec9fc85.pfx',
    ca: 'master-cert.pem'
};
var options = {
    //key: fs.readFileSync(args.key),
    //cert: fs.readFileSync(args.cert),
    pfx: fs.readFileSync(args.pfx),
    //ca: [fs.readFileSync(args.ca)],
    checkServerIdentity: function (servername, cert) {
        //console.log(sname, cert);
        // Need to check servername here, but since it will be 127.0.0.1 
        // we have nothing to do
        return null;
    },
    rejectUnauthorized: false   // <-- demo only
};

var client = tls.connect(PORT, HOST, options, function() {

    // Check if the authorization worked
    var cert = client.getPeerCertificate(true);
    console.log("Connected to ", cert.subject.CN, client.authorized?'✓ authorized':`!!UNAUTHORIZED!! ${client.authorizationError}`);

    // Send a friendly message
    client.write("hello");

});

client.on("data", function(data) {

    console.log('Received: %s [it is %d bytes long]',
        data.toString().replace(/(\n)/gm,""),
        data.length);

    // Close the connection after receiving the message
    client.end();

});

client.on('close', function() {

    console.log("Connection closed");

});

// When an error ocoures, show it.
client.on('error', function(error) {

    console.error(error);

    // Close the connection after the error occurred.
    client.destroy();

});
