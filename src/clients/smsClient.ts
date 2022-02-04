import twilio from "twilio";

export class SmsClient {
    MessagingResponse = null

    constructor() {
        try {
            this.MessagingResponse = twilio.twiml.MessagingResponse;
        } catch (error) {
            throw new Error(error)
        }
    }

    sendMessage(message) {
        // THIS WORKS! ==/
        // https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-node-js#:~:text=const%20twiml%20%3D%20new,end(twiml.toString())%3B
        const twiml = new MessagingResponse();
        twiml.message(message);
        return twiml
        // res.writeHead(200, { 'Content-Type': 'text/xml' });
        // res.end(twiml.toString());

    }

}

