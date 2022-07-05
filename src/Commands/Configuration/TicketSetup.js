const Command = require('../../Structures/Command');
const {
	CommandInteraction,
	MessageEmbed,
	MessageActionRow,
	MessageButton,
	MessageSelectMenu,
	Modal,
	TextInputComponent,
} = require('discord.js');
const guildSchema = require('../../Structures/Database/Schema/GuildSchema');

module.exports = class extends Command {
	constructor(...args) {
		super(...args, {
			description: 'Setup a ticket channel for your Server!',
			category: 'Configuration',
			categoryEmoji: '<:Gears:990580340806516757>',
			guildOnly: true,
			devMode: true,
			userPerms: ['MANAGE_GUILD'],
			botPerms: ['MANAGE_CHANNELS', 'MANAGE_GUILD'],
			options: [],
		});
	}

	/**
	 *
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 *
	 */
	async run(interaction, args) {
		const guildData = await guildSchema.findOne({ guildId: interaction.guild.id });
		if (!guildData) await guildSchema.create({ guildId: interaction.guild.id });

		if (guildData?.isTicketCreated) {
			return interaction.reply({ content: 'This guild has already setup a ticket channel before!', ephemeral: true });
		}

		const getChannel = interaction.guild.channels.cache
			.filter((x) => x.type === 'GUILD_TEXT')
			.sort((a, b) => a.rawPosition - b.rawPosition)
			.map((x) => {
				return {
					label: `#${x.name}`,
					description: `Channel ID: ${x.id}`,
					value: x.id,
				};
			})
			.slice(0, 25);

		const setupEmbed = new MessageEmbed()
			.setTitle('Ticket Setup!')
			.setDescription('Where do you want to setup your ticket channel?')
			.setColor('WHITE');

		const channelSelectorFilter = (inter) => inter.customId === 'channel-select';

		const channelSelector = new MessageActionRow().addComponents(
			new MessageSelectMenu().setCustomId('channel-select').setPlaceholder('Choose a channel').setOptions(getChannel),
		);

		let initialMsg = await interaction.reply({ embeds: [setupEmbed], components: [channelSelector], fetchReply: true });

		const collector = interaction.channel.createMessageComponentCollector({
			filter: channelSelectorFilter,
			componentType: 'SELECT_MENU',
		});

		collector.on('collect', async (inter) => {
			const ticketButtonTemplate = new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId('modal-create-ticket')
					.setStyle('SECONDARY')
					.setLabel('Klik untuk order')
					.setEmoji('<:ticket:990906996624588840>'),
			);
			const orderEmbedTemplate = new MessageEmbed()
				.setTitle('Bikin Ticket Untuk Memesan!')
				.setColor('WHITE')
				.setDescription(['Mau order jasa joki ataupun jasa titip akun kami?', 'Klik button dibawah untuk membuat ticket ya!'].join('\n'));

			const disabledSelectMenu = new MessageActionRow().addComponents(channelSelector.components[0].setDisabled(true));

			const createCategory = await interaction.guild.channels.create('TICKET', {
				type: 'GUILD_CATEGORY',
			});

			const getChannelToSent = interaction.guild.channels.cache.get(inter.values[0]);
			let orderMessage = await getChannelToSent.send({ embeds: [orderEmbedTemplate], components: [ticketButtonTemplate] });

			inter.reply({
				content: `Ticket channel has been setup in: <#${getChannelToSent.id}> and created a category called ${createCategory.name}`,
				ephemeral: true,
			});

			initialMsg.edit({ embeds: [setupEmbed], components: [disabledSelectMenu] });

			await guildSchema.findOneAndUpdate(
				{ guildId: interaction.guild.id },
				{ isTicketCreated: true, ticketSetup: { channelId: getChannelToSent.id, categoryId: createCategory.id, messageId: orderMessage.id } },
			);

			collector.stop();
		});
	}
};
