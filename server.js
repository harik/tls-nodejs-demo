'use strict';

var tls = require('tls');
var fs = require('fs');

const PORT = 1338;
const HOST = '127.0.0.1'

var args = {
    key: 'server-860454dd-pvt-key.pem',
    cert: 'server-860454dd-cert.pem',
    ca: 'master-cert.pem'
};
var options = {
    key: fs.readFileSync(args.key),
    cert: fs.readFileSync(args.cert),
    ca: fs.readFileSync(args.ca),
    requestCert: true,
    rejectUnauthorized: false, // <- demo purpose only
};

var server = tls.createServer(options, function(socket) {

    // Send a friendly message
    //socket.write("I am the server sending you a message.");
    var cert = socket.getPeerCertificate(true);
    console.log("Connected to ", cert.subject.CN, socket.authorized?'✓ authorized':`!!UNAUTHORIZED!! ${socket.authorizationError}`);
    // Print the data that we received
    socket.on('data', function(data) {

        console.log('Received: %s [it is %d bytes long]',
            data.toString().replace(/(\n)/gm,""),
            data.length);
            socket.write("ack");

    });

    // Let us know when the transmission is over
    socket.on('end', function() {

        console.log('EOT (End Of Transmission)');

    });

});

// Start listening on a specific port and address
server.listen(PORT, HOST, function() {

    console.log("I'm listening at %s, on port %s", HOST, PORT);

});

// When an error occurs, show it.
server.on('error', function(error) {

    console.error(error);

    // Close the connection after the error occurred.
    server.destroy();

});
