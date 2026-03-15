import type { ContactFormData } from './contactForm'
import type { RideRequestData } from './rideRequest'
import type { ApplicationData, ApplicationDocument } from './application'

export type EncryptedContactFields = {
  first_name: string
  last_name: string
  email: string
  phone?: string
}

export type EncryptedRideRequestFields = {
  name: string
  dob: string
  phone: string
  email: string
  med_id: string
  pickup_address: string
  dropoff_address: string
}

export type CryptoKeyConfig = {
  kid: string
  key: Buffer
}

export type CryptoConfig = {
  version: string
  current: CryptoKeyConfig
  retired: CryptoKeyConfig[]
  requireAad?: boolean
}

export type CryptoSvc = {
  encrypt(plaintext: string | Buffer, aad?: string): string
  decrypt(envelope: string, aad?: string): string

  encryptRideRequest(rideData: RideRequestData, aad?: string): RideRequestData
  decryptRideRequest<T extends EncryptedRideRequestFields>(rideData: T, aad?: string): T
  decryptRideRequests<T extends EncryptedRideRequestFields>(rideDataArr: T[], aad?: string): T[]

  encryptContact(contactData: ContactFormData, aad?: string): ContactFormData
  decryptContact<T extends EncryptedContactFields>(contactData: T, aad?: string): T
  decryptContacts<T extends EncryptedContactFields>(contactDataArr: T[], aad?: string): T[]

  encryptApplication(app: ApplicationData, aad?: string): ApplicationData
  decryptApplication(app: ApplicationDocument, aad?: string): ApplicationDocument
  decryptApplications(arr: ApplicationDocument[], aad?: string): ApplicationDocument[]
}