import crypto from 'crypto'
import {
  cryptoConfig, CRYPTO_ALGO, CRYPTO_IV_LEN, CRYPTO_TAG_LEN,
} from '../config/crypto'
import type {
  CryptoConfig,
  CryptoSvc,
  EncryptedContactFields,
  EncryptedRideRequestFields
} from '../types/crypto'
import { ContactFormData } from '../types/contactForm'
import { RideRequestData } from '../types/rideRequest'
import type { ApplicationData, ApplicationDocument, FileData } from '../types/application'

export function makeCryptoService(cfg: CryptoConfig): CryptoSvc {
  const keyring = [cfg.current, ...cfg.retired]

  const encrypt = (plaintext: string | Buffer, aad?: string): string => {
    if (plaintext === '') return ''

    if (cfg.requireAad && !aad) throw new Error('AAD required by policy')
    const iv = crypto.randomBytes(CRYPTO_IV_LEN)
    const cipher = crypto.createCipheriv(CRYPTO_ALGO, cfg.current.key, iv, { authTagLength: CRYPTO_TAG_LEN })
    if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'))
    const ct = Buffer.concat([cipher.update(plaintext), cipher.final()])
    const tag = cipher.getAuthTag()
    return `${cfg.version}:${cfg.current.kid}:${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`
  }

  const decrypt = (envelope: string, aad?: string): string => {
    if (envelope === '') return ''

    const [version, kid, rest] = envelope.split(':')
    if (version !== cfg.version || !kid || !rest) throw new Error('Unsupported or malformed envelope')
    const [ivB64, tagB64, ctB64] = rest.split('.')
    const iv = Buffer.from(ivB64, 'base64')
    const tag = Buffer.from(tagB64, 'base64')
    const ct = Buffer.from(ctB64, 'base64')
    const keyEntry = keyring.find(k => k.kid === kid)
    if (!keyEntry) throw new Error('Unknown KID')

    const decipher = crypto.createDecipheriv(CRYPTO_ALGO, keyEntry.key, iv, { authTagLength: CRYPTO_TAG_LEN })
    if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'))
    decipher.setAuthTag(tag)
    const pt = Buffer.concat([decipher.update(ct), decipher.final()])
    return pt.toString('utf8')
  }

  const encryptRideRequest = (rideData: RideRequestData, aad?: string): RideRequestData => {
    if (!rideData) return rideData

    return {
      ...rideData,
      name: encrypt(rideData.name, aad ?? ''),
      dob: encrypt(rideData.dob, aad ?? ''),
      phone: encrypt(rideData.phone, aad ?? ''),
      email: encrypt(rideData.email, aad ?? ''),
      med_id: encrypt(rideData.med_id, aad ?? ''),
      pickup_address: encrypt(rideData.pickup_address, aad ?? ''),
      dropoff_address: encrypt(rideData.dropoff_address, aad ?? ''),
    }
  }

  const decryptRideRequest = <T extends EncryptedRideRequestFields>(rideData: T, aad?: string): T => {
    if (!rideData) return rideData

    return {
      ...rideData,
      name: decrypt(rideData.name, aad ?? ''),
      dob: decrypt(rideData.dob, aad ?? ''),
      phone: decrypt(rideData.phone, aad ?? ''),
      email: decrypt(rideData.email, aad ?? ''),
      med_id: decrypt(rideData.med_id, aad ?? ''),
      pickup_address: decrypt(rideData.pickup_address, aad ?? ''),
      dropoff_address: decrypt(rideData.dropoff_address, aad ?? ''),
    }
  }

  const decryptRideRequests = <T extends EncryptedRideRequestFields>(rideDataArr: T[], aad?: string): T[] => {
    if (!rideDataArr) return rideDataArr
    return rideDataArr.map(ride => decryptRideRequest(ride, aad))
  }

  const encryptContact = (contactData: ContactFormData, aad?: string): ContactFormData => {
    if (!contactData) return contactData

    return {
      ...contactData,
      first_name: encrypt(contactData.first_name, aad ?? ''),
      last_name: encrypt(contactData.last_name, aad ?? ''),
      email: encrypt(contactData.email, aad ?? ''),
      phone: contactData.phone ? encrypt(contactData.phone, aad ?? '') : '',
    }
  }

  const decryptContact = <T extends EncryptedContactFields>(contactData: T, aad?: string): T => {
    if (!contactData) return contactData

    return {
      ...contactData,
      first_name: decrypt(contactData.first_name, aad ?? ''),
      last_name: decrypt(contactData.last_name, aad ?? ''),
      email: decrypt(contactData.email, aad ?? ''),
      phone: contactData.phone ? decrypt(contactData.phone, aad ?? '') : '',
    }
  }

  const decryptContacts = <T extends EncryptedContactFields>(contactDataArr: T[], aad?: string): T[] => {
    if (!contactDataArr) return contactDataArr
    return contactDataArr.map(contact => decryptContact(contact, aad))
  }

  const toStr = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'string' ? v : String(v))

  const encryptFileData = (file: FileData, aad?: string): FileData => {
    if (!file) return file
    return {
      url: encrypt(toStr(file.url), aad ?? ''),
      filename: encrypt(toStr(file.filename), aad ?? '')
    }
  }

  const decryptFileData = (file: FileData, aad?: string): FileData => {
    if (!file) return file
    return {
      url: file.url ? decrypt(file.url, aad ?? '') : '',
      filename: file.filename ? decrypt(file.filename, aad ?? '') : ''
    }
  }

  const encryptApplication = (app: ApplicationData, aad?: string): ApplicationData => {
    if (!app) return app

    return {
      personal: {
        select: encrypt(toStr(app.personal.select), aad ?? ''),
        firstName: encrypt(toStr(app.personal.firstName), aad ?? ''),
        lastName: encrypt(toStr(app.personal.lastName), aad ?? ''),
        address: encrypt(toStr(app.personal.address), aad ?? ''),
        phoneNumber: encrypt(toStr(app.personal.phoneNumber), aad ?? ''),
        over18: encrypt(toStr(app.personal.over18), aad ?? ''),
        citizen: encrypt(toStr(app.personal.citizen), aad ?? ''),
        felony: encrypt(toStr(app.personal.felony), aad ?? '')
      },
      driving: {
        hasEndorsements: encrypt(toStr(app.driving.hasEndorsements), aad ?? ''),
        endorsements: encrypt(toStr(app.driving.endorsements ?? ''), aad ?? ''),
        hasAccidents: encrypt(toStr(app.driving.hasAccidents), aad ?? ''),
        accidents: encrypt(toStr(app.driving.accidents ?? ''), aad ?? ''),
        hasTrafficConvictions: encrypt(toStr(app.driving.hasTrafficConvictions), aad ?? ''),
        trafficConvictions: encrypt(toStr(app.driving.trafficConvictions ?? ''), aad ?? ''),
        hasMVR: encrypt(toStr(app.driving.hasMVR), aad ?? ''),
        MVR: app.driving.MVR ? encryptFileData(app.driving.MVR, aad) : undefined,
        driversLicense: app.driving.driversLicense ? encryptFileData(app.driving.driversLicense, aad) : undefined
      },
      work: {
        learnedAboutUs: encrypt(toStr(app.work.learnedAboutUs), aad ?? ''),
        otherExplain: encrypt(toStr(app.work.otherExplain ?? ''), aad ?? ''),
        hasWorkedAtGoldenGate: encrypt(toStr(app.work.hasWorkedAtGoldenGate), aad ?? ''),
        employmentType: encrypt(toStr(app.work.employmentType), aad ?? ''),
        availability: encrypt(toStr(app.work.availability ?? ''), aad ?? ''),
        willingToWorkOvertime: encrypt(toStr(app.work.willingToWorkOvertime), aad ?? ''),
        preferablePayRate: encrypt(toStr(app.work.preferablePayRate), aad ?? ''),
        dateAvailableToStart: encrypt(toStr(app.work.dateAvailableToStart), aad ?? ''),
        resume: app.work.resume ? encryptFileData(app.work.resume, aad) : { url: encrypt('', aad ?? ''), filename: encrypt('', aad ?? '') }
      }
    }
  }

  const decryptApplication = (app: ApplicationDocument, aad?: string): ApplicationDocument => {
    if (!app) return app

    return {
      ...app,
      personal: {
        select: decrypt(app.personal.select, aad ?? ''),
        firstName: decrypt(app.personal.firstName, aad ?? ''),
        lastName: decrypt(app.personal.lastName, aad ?? ''),
        address: decrypt(app.personal.address, aad ?? ''),
        phoneNumber: decrypt(app.personal.phoneNumber, aad ?? ''),
        over18: decrypt(app.personal.over18, aad ?? ''),
        citizen: decrypt(app.personal.citizen, aad ?? ''),
        felony: decrypt(app.personal.felony, aad ?? '')
      },
      driving: {
        hasEndorsements: decrypt(app.driving.hasEndorsements, aad ?? ''),
        endorsements: app.driving.endorsements ? decrypt(app.driving.endorsements, aad ?? '') : '',
        hasAccidents: decrypt(app.driving.hasAccidents, aad ?? ''),
        accidents: app.driving.accidents ? decrypt(app.driving.accidents, aad ?? '') : '',
        hasTrafficConvictions: decrypt(app.driving.hasTrafficConvictions, aad ?? ''),
        trafficConvictions: app.driving.trafficConvictions ? decrypt(app.driving.trafficConvictions, aad ?? '') : '',
        hasMVR: decrypt(app.driving.hasMVR, aad ?? ''),
        MVR: app.driving.MVR ? decryptFileData(app.driving.MVR, aad) : undefined,
        driversLicense: app.driving.driversLicense ? decryptFileData(app.driving.driversLicense, aad) : undefined
      },
      work: {
        learnedAboutUs: decrypt(app.work.learnedAboutUs, aad ?? ''),
        otherExplain: app.work.otherExplain ? decrypt(app.work.otherExplain, aad ?? '') : '',
        hasWorkedAtGoldenGate: decrypt(app.work.hasWorkedAtGoldenGate, aad ?? ''),
        employmentType: decrypt(app.work.employmentType, aad ?? ''),
        availability: app.work.availability ? decrypt(app.work.availability, aad ?? '') : '',
        willingToWorkOvertime: decrypt(app.work.willingToWorkOvertime, aad ?? ''),
        preferablePayRate: decrypt(app.work.preferablePayRate, aad ?? ''),
        dateAvailableToStart: decrypt(app.work.dateAvailableToStart, aad ?? ''),
        resume: app.work.resume ? decryptFileData(app.work.resume, aad) : { url: '', filename: '' }
      }
    }
  }

  const decryptApplications = (arr: ApplicationDocument[], aad?: string): ApplicationDocument[] => {
    if (!arr) return arr
    return arr.map(a => decryptApplication(a, aad))
  }

  return {
    encrypt,
    decrypt,
    encryptRideRequest,
    decryptRideRequest,
    decryptRideRequests,
    encryptContact,
    decryptContact,
    decryptContacts,
    encryptApplication,
    decryptApplication,
    decryptApplications,
  }
}

export const cryptoService = makeCryptoService(cryptoConfig)