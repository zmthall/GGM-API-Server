
import { NoReplyEmail } from './noReplyEmail';
import { MainEmail } from './mainEmail';

export class Emailer {
    static noreply = new NoReplyEmail();
    static main = new MainEmail();
}