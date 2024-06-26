#!/bin/bash

function createBpn() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/bpn.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/bpn.example.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@10.184.0.8:7054 --caname ca.bpn.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/10-184-0-8-7054-ca-bpn-example-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/10-184-0-8-7054-ca-bpn-example-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/10-184-0-8-7054-ca-bpn-example-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/10-184-0-8-7054-ca-bpn-example-com.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/bpn.example.com/msp/config.yaml"

  # Since the CA serves as both the organization CA and TLS CA, copy the org's root cert that was generated by CA startup into the org level ca and tlsca directories

  # Copy bpn's CA cert to bpn's /msp/tlscacerts directory (for use in the channel MSP definition)
  mkdir -p "${PWD}/organizations/peerOrganizations/bpn.example.com/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem" "${PWD}/organizations/peerOrganizations/bpn.example.com/msp/tlscacerts/ca.crt"

  # Copy bpn's CA cert to bpn's /tlsca directory (for use by clients)
  mkdir -p "${PWD}/organizations/peerOrganizations/bpn.example.com/tlsca"
  cp "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem" "${PWD}/organizations/peerOrganizations/bpn.example.com/tlsca/tlsca.bpn.example.com-cert.pem"

  # Copy bpn's CA cert to bpn's /ca directory (for use by clients)
  mkdir -p "${PWD}/organizations/peerOrganizations/bpn.example.com/ca"
  cp "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem" "${PWD}/organizations/peerOrganizations/bpn.example.com/ca/ca.bpn.example.com-cert.pem"

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca.bpn.example.com --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca.bpn.example.com --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca.bpn.example.com --id.name bpnadmin --id.secret bpnadminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@10.184.0.8:7054 --caname ca.bpn.example.com -M "${PWD}/organizations/peerOrganizations/bpn.example.com/peers/peer0.bpn.example.com/msp" --csr.hosts peer0.bpn.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/bpn.example.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/bpn.example.com/peers/peer0.bpn.example.com/msp/config.yaml"

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@10.184.0.8:7054 --caname ca.bpn.example.com -M "${PWD}/organizations/peerOrganizations/bpn.example.com/peers/peer0.bpn.example.com/tls" --enrollment.profile tls --csr.hosts peer0.bpn.example.com --csr.hosts "10.184.0.8" --tls.certfiles "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem"
  { set +x; } 2>/dev/null

  # Copy the tls CA cert, server cert, server keystore to well known file names in the peer's tls directory that are referenced by peer startup config
  cp "${PWD}/organizations/peerOrganizations/bpn.example.com/peers/peer0.bpn.example.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/bpn.example.com/peers/peer0.bpn.example.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/bpn.example.com/peers/peer0.bpn.example.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/bpn.example.com/peers/peer0.bpn.example.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/bpn.example.com/peers/peer0.bpn.example.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/bpn.example.com/peers/peer0.bpn.example.com/tls/server.key"

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@10.184.0.8:7054 --caname ca.bpn.example.com -M "${PWD}/organizations/peerOrganizations/bpn.example.com/users/User1@bpn.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/bpn.example.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/bpn.example.com/users/User1@bpn.example.com/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://bpnadmin:bpnadminpw@10.184.0.8:7054 --caname ca.bpn.example.com -M "${PWD}/organizations/peerOrganizations/bpn.example.com/users/Admin@bpn.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/bpn/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/bpn.example.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/bpn.example.com/users/Admin@bpn.example.com/msp/config.yaml"
}

function createUser() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/user.example.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/user.example.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@10.184.0.9:8054 --caname ca.user.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/10-184-0-9-8054-ca-user-example-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/10-184-0-9-8054-ca-user-example-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/10-184-0-9-8054-ca-user-example-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/10-184-0-9-8054-ca-user-example-com.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/user.example.com/msp/config.yaml"

  # Since the CA serves as both the organization CA and TLS CA, copy the org's root cert that was generated by CA startup into the org level ca and tlsca directories

  # Copy user's CA cert to user's /msp/tlscacerts directory (for use in the channel MSP definition)
  mkdir -p "${PWD}/organizations/peerOrganizations/user.example.com/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/user/ca-cert.pem" "${PWD}/organizations/peerOrganizations/user.example.com/msp/tlscacerts/ca.crt"

  # Copy user's CA cert to user's /tlsca directory (for use by clients)
  mkdir -p "${PWD}/organizations/peerOrganizations/user.example.com/tlsca"
  cp "${PWD}/organizations/fabric-ca/user/ca-cert.pem" "${PWD}/organizations/peerOrganizations/user.example.com/tlsca/tlsca.user.example.com-cert.pem"

  # Copy user's CA cert to user's /ca directory (for use by clients)
  mkdir -p "${PWD}/organizations/peerOrganizations/user.example.com/ca"
  cp "${PWD}/organizations/fabric-ca/user/ca-cert.pem" "${PWD}/organizations/peerOrganizations/user.example.com/ca/ca.user.example.com-cert.pem"

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca.user.example.com --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering peer1"
  set -x
  fabric-ca-client register --caname ca.user.example.com --id.name peer1 --id.secret peer1pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca.user.example.com --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca.user.example.com --id.name useradmin --id.secret useradminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@10.184.0.9:8054 --caname ca.user.example.com -M "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer0.user.example.com/msp" --csr.hosts peer0.user.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/

  cp "${PWD}/organizations/peerOrganizations/user.example.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer0.user.example.com/msp/config.yaml"

  infoln "Generating the peer1 msp"
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@10.184.0.9:8054 --caname ca.user.example.com -M "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer1.user.example.com/msp" --csr.hosts peer1.user.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/user.example.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer1.user.example.com/msp/config.yaml"

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@10.184.0.9:8054 --caname ca.user.example.com -M "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer0.user.example.com/tls" --enrollment.profile tls --csr.hosts peer0.user.example.com --csr.hosts "10.184.0.9" --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer1-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@10.184.0.9:8054 --caname ca.user.example.com -M "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer1.user.example.com/tls" --enrollment.profile tls --csr.hosts peer1.user.example.com --csr.hosts "10.184.0.10" --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/null

  # Copy the tls CA cert, server cert, server keystore to well known file names in the peer's tls directory that are referenced by peer startup config
  cp "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer0.user.example.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer0.user.example.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer0.user.example.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer0.user.example.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer0.user.example.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer0.user.example.com/tls/server.key"

  # Copy the tls CA cert, server cert, server keystore to well known file names in the peer's tls directory that are referenced by peer startup config
  cp "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer1.user.example.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer1.user.example.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer1.user.example.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer1.user.example.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer1.user.example.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/user.example.com/peers/peer1.user.example.com/tls/server.key"

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@10.184.0.9:8054 --caname ca.user.example.com -M "${PWD}/organizations/peerOrganizations/user.example.com/users/User1@user.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/user.example.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/user.example.com/users/User1@user.example.com/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://useradmin:useradminpw@10.184.0.9:8054 --caname ca.user.example.com -M "${PWD}/organizations/peerOrganizations/user.example.com/users/Admin@user.example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/user/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/user.example.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/user.example.com/users/Admin@user.example.com/msp/config.yaml"
}

function createOrderer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/ordererOrganizations/example.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/example.com

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@10.184.0.8:9054 --caname ca.orderer.example.com --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/10-184-0-8-9054-ca-orderer-example-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/10-184-0-8-9054-ca-orderer-example-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/10-184-0-8-9054-ca-orderer-example-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/10-184-0-8-9054-ca-orderer-example-com.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml"

  # Since the CA serves as both the organization CA and TLS CA, copy the org's root cert that was generated by CA startup into the org level ca and tlsca directories

  # Copy orderer org's CA cert to orderer org's /msp/tlscacerts directory (for use in the channel MSP definition)
  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem"

  # Copy orderer org's CA cert to orderer org's /tlsca directory (for use by clients)
  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/tlsca"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.orderer.example.com-cert.pem"

  infoln "Registering orderer"
  set -x
  fabric-ca-client register --caname ca.orderer.example.com --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the orderer admin"
  set -x
  fabric-ca-client register --caname ca.orderer.example.com --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the orderer msp"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@10.184.0.8:9054 --caname ca.orderer.example.com -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp" --csr.hosts orderer.example.com --csr.hosts 10.184.0.8 --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/config.yaml"

  infoln "Generating the orderer-tls certificates"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@10.184.0.8:9054 --caname ca.orderer.example.com -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls" --enrollment.profile tls --csr.hosts orderer.example.com --csr.hosts 10.184.0.8 --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  # Copy the tls CA cert, server cert, server keystore to well known file names in the orderer's tls directory that are referenced by orderer startup config
  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt"
  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/signcerts/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt"
  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/keystore/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key"

  # Copy orderer org's CA cert to orderer's /msp/tlscacerts directory (for use in the orderer MSP definition)
  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts"
  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.orderer.example.com-cert.pem"

  infoln "Generating the admin msp"
  set -x
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@10.184.0.8:9054 --caname ca.orderer.example.com -M "${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/config.yaml"
}
