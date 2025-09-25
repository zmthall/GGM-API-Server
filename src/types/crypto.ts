import { ContactFormData, ContactFormDocument } from "./contactForm";
import { RideRequestData, RideRequestDocument } from "./rideRequest";

export type CryptoKeyEntry = { kid: string; key: Buffer };
export type CryptoConfig = {
  version: string;        // envelope version tag, e.g. "v1"
  requireAad: boolean;    // policy: require AAD on encrypt/decrypt
  current: CryptoKeyEntry;
  retired: CryptoKeyEntry[];
};

export type CryptoSvc = {
  encrypt(plaintext: string | Buffer, aad?: string): string;
  decrypt(envelope: string, aad?: string): string;
  encryptRideRequest(rideData: RideRequestData, aad?: string): RideRequestData;
  decryptRideRequest(rideData: RideRequestDocument, aad?: string): RideRequestDocument;
  decryptRideRequests(rideDataArr: RideRequestDocument[], aad?: string): RideRequestDocument[];
  encryptContact(contactData: ContactFormData, aad?: string): ContactFormData;
  decryptContact(contactData: ContactFormDocument, aad?: string): ContactFormDocument;
  decryptContacts(contactDataArr: ContactFormDocument[], add?: string): ContactFormDocument[];
};