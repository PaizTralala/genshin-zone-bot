const { Permissions } = require('discord.js');

module.exports = class Command {
	constructor(client, name, options = {}) {
		this.client = client;
		this.name = options.name || name;
		this.description = options.description || 'No description provided.';
		this.category = options.category || 'Miscellaneous';
		this.categoryEmoji = options.categoryEmoji || null;
		this.userPerms = new Permissions(options.userPerms).freeze();
		this.botPerms = new Permissions(options.botPerms).freeze();
		this.ownerOnly = options.ownerOnly || false;
		this.options = options.options || [];
		this.devMode = options.devMode || false;
		this.guildOnly = options.guildOnly || false;
	}

	async run(interaction, args) {
		throw new Error(`Slash Command ${this.name} doesn't provide a run method!`);
	}
};
