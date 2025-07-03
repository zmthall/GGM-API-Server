// /config/recaptchaKeys.ts
import 'dotenv/config';

// environmental keys that are needed for recaptcha
export const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
export const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;