# TLS Demo Using NodeJS

We use unique key pairs for each Device and Server instance to secure communications between them.  The `private key` is available only with the Server or Device in question. The corresponding `public key` is sent as part of a `certifiate` to the other party when extablishing the session.  This `certificate` needs to have been signed by a "Certificate Authority" to ensure its authenticity.  

In this demo, we are our own "Certificate Authority." At the start, we generate a master key and a `master certificate`.   Both the Device and Server can be assured that the other party is who they say they are by using the `master certificate` they both have access to. Most SSL documentaion will call this a `CA certificate` or `root certificate`, but I avoided those terms because we are not using one of the know CAs like VeriSign or Thawte.

Once certificates are exchanged, keys are agreed upon and a session established (all of which happens transparently inside `libssl`), communications between client and server are secured.  Aside from encrypting communications between these two entities, the protocol establishing the SSL session also allows for _authentication_ of both end-points by the other.  This mechanism can be used to supersede the current auth mechanism or  in addition to it as a fail safe.

So, both the Device and Server need these three things to establish a secure session:

1. Their own private key: This is also called the `user key` and must be known only to them.  In the case of a device, for example, we would generate it, flash it and then delete it from everywhere else.  In case of the server, we'll have to store it in the cloud somewhere, but hopefully well secured.

2. Their signed certificate: Also called `user certificate`. This one has the public key  (corresponding to its private key) plus a bunch of meta-info. And it has been signed using our master key. Any other endpoint can examine this certificate and check that the signature could only have come from the master.  The meta-info (called the `subject` of the certificate) is used to identify the device. 

3. The master certificate: Also called `CA certificate` it is used only to verify the other parties' certificate's authenticity

All three of these files can be encapsulated within a single so-called PFX file.


## Demonstration

### Prerequisites

Make sure that `openssl` and `node` are installed.

```sh
$ openssl version
OpenSSL 1.0.2o  27 Mar 2018

$ node --version
v12.16.1
```

### Step 1: Generate the Master Keys and Cerificate

```sh
$ ./mkcert.sh master
Generating key... master-pvt-key.pem
Generating CSR... master-csr.pem
Self-signing CA cert with master-pvt-key.pem ...Exporting cert ...master.pfx
```

Four files will be generated:

```sh
$ ls master*
master.pfx  master-cert.pem  master-csr.pem  master-pvt-key.pem
```

Of these, `master.pfx` and `master-csr.pem` are not needed and can be deleted (In a production env, they _must_ be deleted).  The `master-cert.pem` will be available to all devices and server instances.  It will allow the device/server to verify the certificate sent to it by another server/device.  The `master-pvt-key.pem` is what will be used to sign every device and server key.  It should be kept as secure as can be managed.  Losing this will mean the attacker can sign device certificates and flood us with bad data.

### Step 2: Generate a Device and Server Keys and Cerificate

We'll generate for one example each of device and server.

```sh
$ ./mkcert.sh device
Generating key... device-02d5c135-pvt-key.pem
Generating CSR... device-02d5c135-csr.pem
Signing CSR with CA cert... Signature ok
subject=/C=IN/ST=Karnataka/L=Bengaluru/O=nBase2 Systems/OU=Tracking Dept./emailAddress=admin@nbase2.in/CN=device-02d5c135.nbase2.in
Getting CA Private Key
Exporting cert ...device-02d5c135.pfx

$ ./mkcert.sh server
Generating key... server-64ee71a7-pvt-key.pem
Generating CSR... server-64ee71a7-csr.pem
Signing CSR with CA cert... Signature ok
subject=/C=IN/ST=Karnataka/L=Bengaluru/O=nBase2 Systems/OU=Tracking Dept./emailAddress=admin@nbase2.in/CN=server-64ee71a7.nbase2.in
Getting CA Private Key
Exporting cert ...server-64ee71a7.pfx
```
Notice that the script generated a unique id for the device and server: `02d5c135` for the device and `64ee71a7` for the server. These are also present in the signed certificates issued to them. Examine the `CN` field of the `subject` and `issuer` below.

```sh
$ openssl pkcs12 -info -nodes  -in server-64ee71a7.pfx
Enter Import Password:
MAC Iteration 2048
MAC verified OK
PKCS7 Encrypted data: pbeWithSHA1And40BitRC2-CBC, Iteration 2048
Certificate bag
Bag Attributes
    localKeyID: 7B FA 19 30 8F BF 33 3C BE 35 3E FD CD 58 64 BD BB 0B 5A DF
subject=/C=IN/ST=Karnataka/L=Bengaluru/O=nBase2 Systems/OU=Tracking Dept./emailAddress=admin@nbase2.in/CN=server-64ee71a7.nbase2.in
issuer=/C=IN/ST=Karnataka/L=Bengaluru/O=nBase2 Systems/OU=Tracking Dept./emailAddress=admin@nbase2.in/CN=master.nbase2.in
-----BEGIN CERTIFICATE-----
MIIDxjCCAq4CBGTucacwDQYJKoZIhvcNAQELBQAwgaIxCzAJBgNVBAYTAklOMRIw
EAYDVQQIDAlLYXJuYXRha2ExEjAQBgNVBAcMCUJlbmdhbHVydTEXMBUGA1UECgwO
...
```


### Step 3: Run the Server and Test Coomunications

These are outputs from two different terminals running simultaneously.

```sh
$ node server.js server-64ee71a7.pfx
Listening at 127.0.0.1:1337
Connected to  device-02d5c135.nbase2.in ✓ authorized
Received[5 bytes]: hello
Conn Closed
```

```sh
$ node device.js device-02d5c135.pfx 
Connected to  server-64ee71a7.nbase2.in ✓ authorized
Received [3 bytes]: ack
Connection closed
```

## Next Steps

   1. Do a demo with an actual device
   2. Study overheads of using SSL, effect of keylength and other options
   3. Discuss options for horz scaling
   4. Secure TCP vs. HTTPS vs.  HTTPSv2


