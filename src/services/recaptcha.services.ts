// /services/recaptcha.services.ts
import axios from 'axios';
import { recaptchaSecretKey } from '../config/recaptchaKeys';

export const verifyRecaptchaToken = async (token: string, minimumScore: number = 0.5) => {
  try {
    if (!token) {
      throw new Error('ReCAPTCHA token is required');
    }

    if (!recaptchaSecretKey) {
      throw new Error('ReCAPTCHA secret key is not configured');
    }

    const params = new URLSearchParams({
      secret: recaptchaSecretKey,
      response: token
    });

    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { success, score, action, challenge_ts, hostname } = response.data;

    if (!success) {
      throw new Error('ReCAPTCHA verification failed');
    }

    if (score < minimumScore) {
      throw new Error(`ReCAPTCHA score ${score} below minimum ${minimumScore}`);
    }

    return {
      success: true,
      score,
      action,
      challenge_ts,
      hostname,
      valid: true
    };
  } catch (error) {
    throw new Error(`ReCAPTCHA verification failed: ${(error as Error).message}`);
  }
};