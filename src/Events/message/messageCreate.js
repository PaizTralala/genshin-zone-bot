const Event = require('../../Structures/Event');
const { Message, MessageEmbed, Permissions } = require('discord.js');
const config = require('../../Assets/JSON/config.json');

module.exports = class extends Event {
	/**
	 *
	 * @param {Message} message
	 */
	async run(message) {
		const mentionRegex = new RegExp(`^<@!?${this.client.user.id}>$`);
		const mentionRegexPrefix = new RegExp(`^<@!?${this.client.user.id}> `);

		if (message.author.bot) return;

		if (message.content.match(mentionRegex)) {
			const authorPrefix = message.member.displayName ? message.member.displayName : message.author.username;

			const mentionedEmbed = new MessageEmbed()
				.setAuthor({
					name: `Hello, ${authorPrefix}!`,
					iconURL: message.author.displayAvatarURL({ dynamic: true }),
				})
				.setDescription('To run a command, use (/) slash command.')
				.setColor(this.client.config.color.cream);

			await message.channel.sendTyping();
			return message.reply({
				embeds: [mentionedEmbed],
			});
		}

		const mainPrefix = message.content.match(mentionRegexPrefix)
			? message.content.match(mentionRegexPrefix)[0]
			: this.client.config.client.prefix;

		const [cmd, ...args] = message.content.slice(mainPrefix.length).trim().split(/ +/g);

		// If the user ran the command inside the guild do:
		if (message.guild) {
			const isOwner = config.client.owners.includes(message.author.id);

			if (cmd === 'deploy_beta' && isOwner) {
				const getSlashData = this.client.commands.map((x) => x).filter((x) => x.devMode === true);

				try {
					const msg = await message.reply({ content: '<a:val_dc_load:957192309399760926> Deploying slash commands... Please wait!' });

					// IF the devMode is true, set to your own guild.
					await this.client.guilds.cache.get(message.guild.id).commands.set(getSlashData);

					return msg.edit({ content: `Deployed slash commands in **${message.guild.name}**!` });
				} catch (err) {
					this.client.logger.err(`[DEPLOY] [PREFIX-COMMAND] ${err.message}`);
				}
			}

			if (cmd === 'remove_beta' && isOwner) {
				try {
					const msg = await message.reply({ content: '<a:val_dc_load:957192309399760926> Removing slash commands... Please wait!' });

					await message.guild.commands.set([]);

					return msg.edit({ content: `Removed slash commands in **${message.guild.name}**!` });
				} catch (err) {
					this.client.logger.err(`[UNDEPLOY] [PREFIX-COMMAND] ${err.message}`);
				}
			}

			if (cmd === 'emit' && isOwner) {
				const availableEvent = this.client.events
					.map((r) => r.name)
					.filter((ev) => !['ready', 'messageCreate', 'interactionCreate'].includes(ev));
				const grammarCheck = availableEvent.length > 1 ? 's' : '';

				switch (args[0]) {
					case 'guildCreate':
						await this.client.emit('guildCreate', message.guild);
						message.reply({
							content: `Emitted **${args[0]}** event!`,
						});
						break;
					case 'guildDelete':
						await this.client.emit('guildDelete', message.guild);
						message.reply({
							content: `Emitted **${args[0]}** event`,
						});
						break;
					default:
						return message.reply({
							content: `Cannot find that event! (Sensitive case!)\n\nThere are ${
								availableEvent.length
							} available event${grammarCheck}:\n**${availableEvent.join('\n')}**`,
						});
				}
			}
		} else return;
	}
};
