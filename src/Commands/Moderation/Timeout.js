const Command = require('../../Structures/Command');
const { Interaction } = require('discord.js');
const ms = require('ms');

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			description: 'Timeout a user in a guild.',
			category: 'Moderation',
			categoryEmoji: '<:Moderator:971619107260751882>',
			guildOnly: true,
			devMode: false,
			userPerms: ['MODERATE_MEMBERS'],
			botPerms: ['MODERATE_MEMBERS'],
			options: [
				{
					name: 'add',
					description: 'Add a user to a timeout state!',
					type: 'SUB_COMMAND',
					options: [
						{
							name: 'user',
							description: 'Provide a user to timeout!',
							type: 'USER',
							required: true,
						},
						{
							name: 'time',
							description: 'Provide a time!',
							type: 'STRING',
							required: true,
						},
					],
				},
				{
					name: 'remove',
					description: 'Removes a user timeout',
					type: 'SUB_COMMAND',
					options: [
						{
							name: 'user',
							description: 'Provide a user!',
							type: 'USER',
							required: true,
						},
					],
				},
			],
		});
	}

	/**
	 *
	 * @param {Interaction} interaction
	 * @param {String[]} args
	 *
	 */
	async run(interaction, args) {
		const commandName = interaction.options._subcommand;

		const getUser = interaction.options.getUser('user');
		const getTime = interaction.options.getString('time');

		const user = interaction.guild.members.cache.find((mem) => mem.id === getUser.id);

		switch (commandName) {
			case 'add':
				if (!user.moderatable) {
					return interaction.reply({ content: "Can't moderate this user!", ephemeral: true });
				}

				const time = ms(getTime);

				if (typeof time === 'undefined') {
					return interaction.reply({
						content: 'Invalid input of time!\nTime must be in a time format! ex: `10s`, `10hrs`, `5 days`!',
						ephemeral: true,
					});
				}

				if (time <= 9999 || time > 2419200000) {
					return interaction.reply({
						content: 'You cannot timeout someone for less than 10 seconds or for more than 28 days',
						ephemeral: true,
					});
				} else {
					try {
						await user.timeout(time);

						const timeUntil = new Date(user.communicationDisabledUntilTimestamp);
						const targetTime = timeUntil.getTime();
						const targetTimeResult = Math.trunc(targetTime / 1000);

						interaction.reply({
							content: `Set timeout for **${user.user.tag}** until <t:${targetTimeResult}:F> - Expired <t:${targetTimeResult}:R>`,
							ephemeral: true,
						});
					} catch (err) {
						console.log(err);
						return interaction.reply({ content: 'Something went wrong when trying to timeout a user!', ephemeral: true });
					}
				}
				break;

			case 'remove':
				if (!user.moderatable) {
					return interaction.reply({ content: "Can't moderate this user!", ephemeral: true });
				}

				if (user.communicationDisabledUntilTimestamp === null) {
					return interaction.reply({ content: `**${user.user.tag}** are not in a timeout!`, ephemeral: true });
				}

				try {
					await user.timeout(null, `Requested by ${interaction.user.tag}`);
					interaction.reply({ content: `Removed timeout for **${user.user.tag}**!`, ephemeral: true });
				} catch (err) {
					console.log(err);
					return interaction.reply({ content: "Something went wrong when trying to remove a user's timeout!", ephemeral: true });
				}
				break;
		}
	}
};
