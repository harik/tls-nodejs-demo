#!/bin/sh

country="IN"
state="Karnataka"
locality="Bengaluru"
organization="nBase2 Systems"
organizationalunit="Tracking Dept."
email="admin@nbase2.in"
SUBJ="/C=$country/ST=$state/L=$locality/O=$organization/OU=$organizationalunit/emailAddress=$email"

function usage {
    cat <<EOF
Usage: 
    $0 <master|server|device> [uuid]
           (A unique "id" is optional.  The script
            will generate a random one if unspecified)
Description:
    $0 generates a cert and private key used in securing
    connections.

    master: The master key is self-signed and also used to sign other keys
    server: Used on the server side
    device: Used on the device side

    There can only be one master key.  Generate it first and it can be
    used to sign multiple server and device certificates.

    See README.md for more details.
EOF

    exit 0

}
if [[ "$#" -ne 1 ]] && [[ "$#" -ne 2 ]] 
then
    usage
fi

beast=$1
id=${2:-`uuidgen`}

if [ "$beast" != "master" ] && [ "$beast" != "server" ] && [ "$beast" != "device" ]
then
    usage
fi


prefix=$beast
if [ "$prefix" != "master" ]
then
    if ! [ -f "master-pvt-key.pem" ] || !  [ -f "master-cert.pem" ]
    then
        echo "Master key not found.  Please generate it first, using:"
        echo "    $0 master"
        exit 2
    fi
    prefix="${prefix}-${id:0:8}"
fi

echo -n "Generating key... "
 openssl genrsa -out ${prefix}-pvt-key.pem 2048  > /dev/null 2>&1
echo "${prefix}-pvt-key.pem"

echo -n "Generating CSR... "
 openssl req -new -sha256 -key ${prefix}-pvt-key.pem -out ${prefix}-csr.pem -passin pass:"" -subj "${SUBJ}/CN=${prefix}.nbase2.in" > /dev/null 2>&1
echo ${prefix}-csr.pem

if [ "$prefix" == "master" ]
then
    echo -n "Self-signing CA cert with master-pvt-key.pem ..."
    openssl x509 -req -in  ${prefix}-csr.pem -signkey master-pvt-key.pem -out ${prefix}-cert.pem > /dev/null 2>&1
else
    echo -n "Signing CSR with CA cert... "
    openssl x509 -req -in  ${prefix}-csr.pem -CA master-cert.pem -CAkey master-pvt-key.pem -set_serial "0x${id:0:8}" -out ${prefix}-cert.pem 
fi

echo -n "Exporting cert ..."
 openssl pkcs12 -export -in ${prefix}-cert.pem -inkey ${prefix}-pvt-key.pem -passin pass:""  -passout pass:""  -certfile master-cert.pem -out ${prefix}.pfx > /dev/null 2>&1
echo ${prefix}.pfx

