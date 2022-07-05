const Command = require('../../Structures/Command');
const { Interaction, MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const { links, client, color } = require('../../Assets/JSON/config.json');

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			description: 'Display some information about this bot!',
			category: 'Information',
			categoryEmoji: '<:information:965480660833812493>',
			guildOnly: true,
			devMode: false,
			userPerms: [],
			botPerms: [],
			options: [],
		});
	}

	/**
	 *
	 * @param {Interaction} interaction
	 * @param {String[]} args
	 *
	 */
	async run(interaction, args) {
		try {
			const getUsers = this.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
			const getGuildCount = this.client.guilds.cache.size;

			const getCategory = this.client.utils.removeDupedLabel(
				this.client.commands.map((cmd) => ({
					label: cmd.category,
					value: cmd.category.toLowerCase(),
					description: `Shows you ${cmd.category} category commands!`,
					emoji: cmd.categoryEmoji,
				})),
			);

			const selectMenu = new MessageActionRow().addComponents(
				new MessageSelectMenu().setCustomId('help-menu').addOptions(getCategory).setPlaceholder('Select a category!'),
			);

			const mainMenuEmbed = new MessageEmbed()
				.setTitle(`${this.client.user.username}'s Help Center!`)
				.setColor(color.cream)
				.setDescription(
					[
						`**${this.client.user.username}** is a bot dedicated to [**GenshinZone Indonesia**](https://www.discord.gg/AyjH2SE6pB) Discord server!`,
						`I'm currently serving **${getUsers}** users, and I'm in **${getGuildCount}** servers!`,
					].join('\n'),
				)
				.addField('Commands', [`>>> To see my slash commands, click the select menu below!`, ''].join('\n'))
				.addField(
					'Useful Links',
					`[Invite Me!](${links.botInvite}) | [Support Server](${links.supportInvite}) | [Support Us!](${links.saweria})`,
				);

			const msg = await interaction.reply({ embeds: [mainMenuEmbed], components: [selectMenu], fetchReply: true });

			const filter = async (interaction) => interaction.customId === 'help-menu';

			const collector = interaction.channel.createMessageComponentCollector({
				filter,
				time: 7000,
				componentType: 'SELECT_MENU',
			});

			collector.on('collect', async (interaction) => {
				await interaction.deferReply({ ephemeral: true });

				const commandNameList = this.client.commands
					.filter((cmd) => cmd.category.toLowerCase() === interaction.values[0].toLowerCase())
					.map((cmd) => `${cmd.name}\n<:anotha_curve:965498554728742932> ${cmd.description}`);

				const collectorEmbed = new MessageEmbed()
					.setTitle(`${this.client.utils.capitalise(interaction.values[0])} Category Command Lists!`)
					.setColor(color.cream)
					.setDescription(commandNameList.join('\n'));

				collector.resetTimer({ time: 10000, idle: 10000 });

				interaction.followUp({ embeds: [collectorEmbed] });
			});

			collector.on('end', (interaction) => {
				const disabledMenu = new MessageActionRow().addComponents(
					selectMenu.components[0].setDisabled(true).setPlaceholder('This select menu has expired!'),
				);

				msg.edit({ embeds: [mainMenuEmbed], components: [disabledMenu] });
			});
		} catch (err) {
			console.log(err);
		}
	}
};
