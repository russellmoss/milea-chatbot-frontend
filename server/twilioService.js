const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const sendSmsMessage = async (to, message) => {
    try {
        const result = await client.messages.create({
            body: message,
            to: to,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        console.log('SMS sent successfully:', result.sid);
        return result;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
};

module.exports = {
    sendSmsMessage
}; 