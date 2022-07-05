const Event = require('../Structures/Event');

module.exports = class extends Event {
	constructor(...args) {
		super(...args, {
			once: true,
		});
	}

	async run() {
		this.client.logger.ready(`Logged In As ${this.client.user.tag}`);
		this.client.logger.ready(`Loaded ${this.client.events.size} Events!`);

		// Status
		let number = 0;
		const updateActivity = () => {
			const getGuildCount = this.client.guilds.cache.size;
			const getGuildUsers = this.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);

			const statusString = [
				{
					name: '/help',
					type: 'LISTENING',
				},
				{
					name: `GenshinZone Indonesia`,
					type: 'WATCHING',
				},
				{
					name: `${getGuildUsers} Users!`,
					type: 'WATCHING',
				},
			];

			this.client.user.setPresence({
				status: 'online',
				activities: [statusString[number]],
			});

			if (++number >= statusString.length) {
				number = 0;
			}

			setTimeout(updateActivity, 1000 * 60 * 5);
		};
		updateActivity();

		// Load slash command!
		await this.client.utils.loadSlashCommands().then(() => {
			this.client.logger.ready(`Loaded ${this.client.commands.size} Slash Commands!`);
		});

		// * Deploying slash commands in global
		const getSlashData = this.client.commands.map((x) => x);
		const devModeFalse = getSlashData.filter((x) => x.devMode === false);

		try {
			await this.client.application.commands.set(devModeFalse);
			this.client.logger.ready(`Slash Commands Deployed Globally!`);
		} catch (err) {
			console.log(err);
		}
	}
};
