// services/crypto.ts
import crypto from 'crypto';
import {
  cryptoConfig, CRYPTO_ALGO, CRYPTO_IV_LEN, CRYPTO_TAG_LEN,
} from '../config/crypto';
import type { CryptoConfig, CryptoSvc } from '../types/crypto';
import { ContactFormData, ContactFormDocument } from '../types/contactForm';
import { RideRequestData, RideRequestDocument } from '../types/rideRequest';

// Factory (real “class without the class”)
export function makeCryptoService(cfg: CryptoConfig): CryptoSvc {
  const keyring = [cfg.current, ...cfg.retired];

  const encrypt = (plaintext: string | Buffer, aad?: string): string => {
    if (cfg.requireAad && !aad) throw new Error('AAD required by policy');
    const iv = crypto.randomBytes(CRYPTO_IV_LEN);
    const cipher = crypto.createCipheriv(CRYPTO_ALGO, cfg.current.key, iv, { authTagLength: CRYPTO_TAG_LEN });
    if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));
    const ct  = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${cfg.version}:${cfg.current.kid}:${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
  }

  const decrypt = (envelope: string, aad?: string): string => {
    const [version, kid, rest] = envelope.split(':');
    if (version !== cfg.version || !kid || !rest) throw new Error('Unsupported or malformed envelope');
    const [ivB64, tagB64, ctB64] = rest.split('.');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ct  = Buffer.from(ctB64, 'base64');
    const keyEntry = keyring.find(k => k.kid === kid);
    if (!keyEntry) throw new Error('Unknown KID');

    const decipher = crypto.createDecipheriv(CRYPTO_ALGO, keyEntry.key, iv, { authTagLength: CRYPTO_TAG_LEN });
    if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'));
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString('utf8');
  }

  const encryptRideRequest = (rideData: RideRequestData, aad?: string ): RideRequestData => {
    if(!rideData) return rideData

      return {
        ...rideData,
        name: encrypt(rideData.name, aad ?? ''),
        dob: encrypt(rideData.dob, aad ?? ''),
        phone: encrypt(rideData.phone, aad ?? ''),
        email: encrypt(rideData.email, aad ?? ''),
        med_id: encrypt(rideData.med_id, aad ?? ''),
        pickup_address: encrypt(rideData.pickup_address, aad ?? ''),
        dropoff_address: encrypt(rideData.dropoff_address, aad ?? '')
      }
  }

  const decryptRideRequest = (rideData: RideRequestDocument, aad?: string): RideRequestDocument => {
    if(!rideData) return rideData

    return {
      ...rideData,
      name: decrypt(rideData.name, aad ?? ''),
      dob: decrypt(rideData.dob, aad ?? ''),
      phone: decrypt(rideData.phone, aad ?? ''),
      email: decrypt(rideData.email, aad ?? ''),
      med_id: decrypt(rideData.med_id, aad ?? ''),
      pickup_address: decrypt(rideData.pickup_address, aad ?? ''),
      dropoff_address: decrypt(rideData.dropoff_address, aad ?? '')
    }
  }

  const decryptRideRequests = (rideDataArr: RideRequestDocument[], aad?: string): RideRequestDocument[] => {
    if(!rideDataArr) return rideDataArr;

    const decryptedRideDataArr: RideRequestDocument[] = []

    rideDataArr.forEach(ride => decryptedRideDataArr.push(decryptRideRequest(ride)))

    return decryptedRideDataArr as RideRequestDocument[];
  }

  const encryptContact = (contactData: ContactFormData, aad?: string): ContactFormData => {
    if(!contactData) return contactData;

    return {
      ...contactData,
      first_name: encrypt(contactData.first_name, aad ?? ''),
      last_name: encrypt(contactData.last_name, aad ?? ''),
      email: encrypt(contactData.email, aad ?? ''),
      phone: contactData.phone || contactData.phone === '' ? encrypt(contactData.phone, aad ?? '') : ''
    }
  }

  const decryptContact = (contactData: ContactFormDocument, aad?: string): ContactFormDocument => {
    if(!contactData) return contactData;

    return {
      ...contactData,
      first_name: decrypt(contactData.first_name, aad ?? ''),
      last_name: decrypt(contactData.last_name, aad ?? ''),
      email: decrypt(contactData.email, aad ?? ''),
      phone: contactData.phone || contactData.phone === '' ? decrypt(contactData.phone, aad ?? '') : ''
    } as ContactFormDocument;
  }

  const decryptContacts = (contactDataArr: ContactFormDocument[], add?: string): ContactFormDocument[] => {
    if(!contactDataArr) return contactDataArr;

    const decryptedContactDataArr: ContactFormDocument[] = []

    contactDataArr.forEach(contact => decryptedContactDataArr.push(decryptContact(contact)))

    return decryptedContactDataArr as ContactFormDocument[];
  }

  return { 
    encrypt, 
    decrypt, 
    encryptRideRequest,
    decryptRideRequest,
    decryptRideRequests,
    encryptContact,
    decryptContact,
    decryptContacts
  };
}

// Default singleton instance using env/file config
export const cryptoService = makeCryptoService(cryptoConfig);
