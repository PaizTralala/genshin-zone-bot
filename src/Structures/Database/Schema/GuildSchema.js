const { Schema, model } = require('mongoose');

const guildSchema = new Schema({
	guildId: { type: String, unique: true },
	isTicketCreated: { type: Boolean, default: false },
	totalCreatedTicket: { type: Number, default: 0 },
	ticketSetup: {
		channelId: { type: String, default: null },
		categoryId: { type: String, default: null },
		messageId: { type: String, default: null },
	},
});

module.exports = model('guild-data', guildSchema);
