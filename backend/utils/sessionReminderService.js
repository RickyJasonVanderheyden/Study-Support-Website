const cron = require('node-cron');
const PeerSession = require('../models/PeerSession');
const SessionBooking = require('../models/SessionBooking');
const { sendSessionReminder } = require('./whatsappService');

class SessionReminderService {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('📅 Session reminder service is already running');
      return;
    }

    // Run every 5 minutes to check for sessions starting in 30 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.checkAndSendReminders();
    });

    this.isRunning = true;
    console.log('📅 Session reminder service started - checking every 5 minutes');
  }

  async checkAndSendReminders() {
    try {
      // Calculate time window: sessions starting between 25-35 minutes from now
      const now = new Date();
      const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
      const twentyFiveMinutesFromNow = new Date(now.getTime() + 25 * 60 * 1000);
      const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60 * 1000);

      // Find sessions starting in the next 25-35 minutes
      const upcomingSessions = await PeerSession.find({
        dateTime: {
          $gte: twentyFiveMinutesFromNow,
          $lte: thirtyFiveMinutesFromNow
        },
        status: 'upcoming'
      }).select('title hostName dateTime meetingLink');

      if (upcomingSessions.length === 0) {
        return; // No sessions to remind about
      }

      console.log(`📅 Found ${upcomingSessions.length} session(s) starting soon`);

      for (const session of upcomingSessions) {
        // Get all active bookings for this session
        const bookings = await SessionBooking.find({
          sessionId: session._id,
          status: 'joined'
        }).select('studentMobile');

        if (bookings.length === 0) {
          continue; // No participants to remind
        }

        // Prepare session details for the message
        const sessionDetails = {
          title: session.title,
          leadName: session.hostName,
          date: session.dateTime.toLocaleDateString(),
          time: session.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: session.meetingLink // Assuming meeting link represents location
        };

        // Send reminders to all participants
        let successCount = 0;
        let failureCount = 0;

        for (const booking of bookings) {
          try {
            const result = await sendSessionReminder(booking.studentMobile, sessionDetails);
            if (result.success) {
              successCount++;
            } else {
              failureCount++;
            }
          } catch (error) {
            console.error(`❌ Failed to send reminder to ${booking.studentMobile}:`, error.message);
            failureCount++;
          }
        }

        console.log(`✅ Session "${session.title}": Sent ${successCount} reminders, ${failureCount} failed`);
      }

    } catch (error) {
      console.error('❌ Error in session reminder service:', error);
    }
  }

  // Manual trigger for testing
  async triggerReminders() {
    console.log('🔧 Manually triggering session reminders...');
    await this.checkAndSendReminders();
  }
}

module.exports = new SessionReminderService();