
import { NoReplyEmailService } from './NoReplyEmailService';
import { MainEmailService } from './MainEmailService';

export class Emailer {
    static noreply = new NoReplyEmailService();
    static main = new MainEmailService();
}