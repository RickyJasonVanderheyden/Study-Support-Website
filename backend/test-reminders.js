// Test script for WhatsApp reminders
const sessionReminderService = require('./utils/sessionReminderService');

async function testReminders() {
  console.log('🧪 Testing session reminder service...');
  await sessionReminderService.triggerReminders();
  console.log('✅ Test completed');
}

if (require.main === module) {
  testReminders().catch(console.error);
}

module.exports = { testReminders };