
import { NoReplyEmailService } from './NoReplyEmailService';
import { MainEmailService } from './MainEmailService';

export class Emailer {
    static readonly noreply = new NoReplyEmailService();
    static readonly main = new MainEmailService();
}