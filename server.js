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
    requestCert: true,
    rejectUnauthorized: false, // <- demo purpose only
};

var server = (USE_SSL?tls:net).createServer(options, function(socket) {

    if (USE_SSL) {
        var cert = socket.getPeerCertificate(true);
        console.log("Connected to ", cert.subject.CN, socket.authorized?'✓ authorized':`!!UNAUTHORIZED!! ${socket.authorizationError}`);
    }

    // Print the data that we received
    socket.on('data', function(data) {

        console.log('Received[%d bytes]: %s',
            data.length, 
            data.toString().replace(/(\n)/gm,""));
        
            socket.write("ack");

    });

    // Let us know when the transmission is over
    socket.on('end', () => console.log('Conn Closed'));

});

// Start listening on a specific port and address
server.listen(PORT, HOST, ()=> console.log("Listening at %s:%s", HOST, PORT));

// When an error occurs, show it.
server.on('error', function(error) {
    console.error(error);
    server.destroy();
});
