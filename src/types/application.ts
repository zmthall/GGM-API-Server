export interface FileUpload {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export interface FileData {
  url: string;
  filename: string;
}

export interface ApplicationPersonal {
  select: string;
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber: string;
  over18: string;
  citizen: string;
  felony: string;
}

export interface ApplicationDriving {
  hasEndorsements: string;
  endorsements?: string;
  hasAccidents: string;
  accidents?: string;
  hasTrafficConvictions: string;
  trafficConvictions?: string;
  hasMVR: string;
  MVR?: FileData;
  driversLicense?: FileData;
}

export interface ApplicationWork {
  learnedAboutUs: string;
  otherExplain?: string;
  hasWorkedAtGoldenGate: string;
  employmentType: string;
  availability?: string;
  willingToWorkOvertime: string;
  preferablePayRate: string;
  dateAvailableToStart: string;
  resume: FileData;
}

export interface ApplicationData {
  personal: ApplicationPersonal;
  driving: ApplicationDriving;
  work: ApplicationWork;
}