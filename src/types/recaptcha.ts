export interface RecaptchaVerificationResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

export interface RecaptchaResult {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  valid: boolean;
}