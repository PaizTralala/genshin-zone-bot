const { Schema, model } = require('mongoose');

const userSchema = new Schema({
	userId: { type: String, default: null },
	guildId: { type: String, default: null },
	ticket: {
		channelId: { type: String, default: null },
		isOpen: { type: Boolean, default: false },
	},
});

module.exports = model('user-data', userSchema);
