const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let client;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

const sendWhatsAppMessage = async (to, message) => {
  try {
    // Check if Twilio is configured
    if (!client || !accountSid || accountSid === 'your-twilio-account-sid') {
      console.warn('⚠️ WhatsApp not configured: Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file');
      return { success: false, error: 'WhatsApp not configured' };
    }

    // Ensure the recipient number is in the correct format for WhatsApp
    const recipientNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    console.log(`📱 Sending WhatsApp message to ${recipientNumber}...`);

    const response = await client.messages.create({
      body: message,
      from: whatsappNumber,
      to: recipientNumber
    });

    console.log('✅ WhatsApp message sent successfully:', response.sid);
    return { success: true, messageId: response.sid };
  } catch (error) {
    console.error('❌ WhatsApp message failed:', error.message);
    return { success: false, error: error.message };
  }
};

const sendSessionReminder = async (userMobile, sessionDetails) => {
  const message = `🔔 *LearnLoop Session Reminder*

Hi! This is a reminder for your upcoming study session:

📚 *Session:* ${sessionDetails.title}
👨‍🏫 *Lead:* ${sessionDetails.leadName}
📅 *Date:* ${sessionDetails.date}
⏰ *Time:* ${sessionDetails.time}
📍 *Location:* ${sessionDetails.location}

The session will start in 30 minutes. Please be on time!

Best regards,
LearnLoop Team`;

  return await sendWhatsAppMessage(userMobile, message);
};

const sendSessionUpdate = async (userMobile, sessionDetails, updateType) => {
  let message = '';

  switch (updateType) {
    case 'cancelled':
      message = `❌ *Session Cancelled*

Your scheduled session has been cancelled:

📚 *Session:* ${sessionDetails.title}
📅 *Date:* ${sessionDetails.date}

Please check for alternative sessions.

LearnLoop Team`;
      break;

    case 'rescheduled':
      message = `🔄 *Session Rescheduled*

Your session has been rescheduled:

📚 *Session:* ${sessionDetails.title}
📅 *New Date:* ${sessionDetails.newDate}
⏰ *New Time:* ${sessionDetails.newTime}

LearnLoop Team`;
      break;

    case 'joined':
      message = `✅ *Successfully Joined Session*

You have successfully joined:

📚 *Session:* ${sessionDetails.title}
👨‍🏫 *Lead:* ${sessionDetails.leadName}
📅 *Date:* ${sessionDetails.date}

See you there!

LearnLoop Team`;
      break;

    default:
      message = `📢 *Session Update*

${sessionDetails.message}

LearnLoop Team`;
  }

  return await sendWhatsAppMessage(userMobile, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendSessionReminder,
  sendSessionUpdate,
};