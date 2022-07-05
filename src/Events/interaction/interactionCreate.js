const Event = require('../../Structures/Event');
const { Interaction, MessageActionRow, MessageButton, MessageEmbed, Modal, TextInputComponent, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const guildSchema = require('../../Structures/Database/Schema/GuildSchema');
const userSchema = require('../../Structures/Database/Schema/UserSchema');
const { color } = require('../../Assets/JSON/config.json');

module.exports = class extends Event {
	/**
	 *
	 * @param {Interaction} interaction
	 */
	async run(interaction) {
		if (interaction.isCommand()) {
			try {
				const command = this.client.commands.get(interaction.commandName);

				if (!command) {
					return interaction.reply({ content: 'Unknown command', ephemeral: true });
				}

				const args = [];
				for (const option of interaction.options.data) {
					if (option.type === 'SUB_COMMAND') {
						if (option.name) {
							args.push(option.name);
						}
						option.options.forEach((x) => {
							if (x.value) args.push(x.value);
						});
					} else if (option.value) {
						args.push(option.value);
					}
				}

				if (command.guildOnly && !interaction.guild) {
					return interaction.reply({ content: 'Sorry, this command only works in Discord Server!', ephemeral: true });
				}

				if (command.ownerOnly && !this.client.utils.checkOwner(interaction.user.id)) {
					return interaction.reply({ content: 'Sorry, this command are available to the Creator of the Bot only!', ephemeral: true });
				}

				if (interaction.guild) {
					const userPermCheck = command.userPerms ? this.client.defaultPerms.add(command.userPerms) : this.client.defaultPerms;
					if (userPermCheck) {
						const missing = interaction.channel.permissionsFor(interaction.member).missing(userPermCheck);
						const grammarCheck = missing.length > 1 ? '' : 's';
						if (missing.length) {
							return interaction.reply({
								content: `Sorry, you need \`${this.client.utils.formatArray(
									missing.map(this.client.utils.formatPerms),
								)}\` permission${grammarCheck} to do this slash command!`,
								ephemeral: true,
							});
						}
					}
				}

				interaction.member = interaction.guild.members.cache.get(interaction.user.id);
				command.run(
					interaction,
					args,
					interaction.options._hoistedOptions.map((value) => value.value),
				);
			} catch (err) {
				console.log(err);

				return interaction.reply({
					content: `Something went wrong when trying to run **${interaction.commandName}** Command!\nPlease report it to the Bot Developer instead. **Paiz#5599**`,
				});
			}
		}

		if (interaction.isModalSubmit()) {
			const guildData = await guildSchema.findOne({ guildId: interaction.guild.id });

			const userData = await userSchema.findOne({ userId: interaction.user.id });
			if (!userData) await userSchema.create({ userId: interaction.user.id, guildId: interaction.guild.id });

			const perGuildTicketCreated = String(guildData.totalCreatedTicket + 1).padStart(4, '0');
			const createChannel = await interaction.guild.channels
				.create(`ticket-${perGuildTicketCreated}`, {
					type: 'GUILD_TEXT',
					topic: `A ticket for ${interaction.user.tag} with id: ${interaction.user.id}`,
					parent: guildData.ticketSetup.categoryId,
					permissionOverwrites: [
						{
							id: interaction.member.user.id,
							allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY'],
						},
						{
							id: interaction.guild.roles.everyone.id,
							deny: ['VIEW_CHANNEL'],
						},
					],
				})
				.catch((err) => {
					console.log(err);
					interaction.reply({ content: `Something went wrong, maybe the category got deleted?`, ephemeral: true });
				});

			await guildSchema.findOneAndUpdate({ guildId: interaction.guild.id }, { $inc: { totalCreatedTicket: 1 } });

			await userSchema.updateOne(
				{ guildId: interaction.guild.id, userId: interaction.user.id },
				{
					userId: interaction.user.id,
					ticket: { isOpen: true, channelId: createChannel.id },
				},
			);

			const ticketChannelComponent = new MessageActionRow().addComponents(
				new MessageButton().setCustomId('close-ticket').setLabel('Close ticket').setEmoji('<:trash_bin:990908824556806185>').setStyle('DANGER'),
			);
			const userGuideEmbed = new MessageEmbed()
				.setAuthor({ name: 'Ticket Status: OPEN', iconURL: this.client.user.displayAvatarURL() })
				.setColor('WHITE')
				.setDescription(['Selagi ticketmu telah berhasil dibuat, mohon tunggu. Para penjoki akan segera membantu ☺'].join('\n'))
				.addField('Guide', ['<:trash_bin:990908824556806185> - To close the ticket channel'].join('\n'));

			const rolePenjoki = '885415451583189003';
			const getJasa = interaction.fields.getTextInputValue('kategoriJasa');

			const getUserTicketChannel = interaction.guild.channels.cache.get(createChannel.id);
			getUserTicketChannel.send({
				content: `Woy <@&${rolePenjoki}>, ada yang mau order "${getJasa.toUpperCase()}", buruann!`,
				embeds: [userGuideEmbed],
				components: [ticketChannelComponent],
			});

			interaction.reply({ content: `Created a ticket channel, go to ${createChannel} to discuss your needs!`, ephemeral: true });
		}

		if (interaction.isButton()) {
			switch (interaction.customId) {
				case 'modal-create-ticket':
					const userData = await userSchema.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
					if (!userData) await userSchema.create({ userId: interaction.user.id, guildId: interaction.guild.id });

					if (userData?.ticket.isOpen === true) {
						return interaction.reply({ content: 'You already created a ticket before, please close it first.', ephemeral: true });
					}

					const modalComponent = new TextInputComponent()
						.setCustomId('kategoriJasa')
						.setLabel('Berikan kategori yang ingin kakak order!')
						.setPlaceholder('Contoh: "Joki" atau "Consign Account"')
						.setStyle('SHORT')
						.setRequired(true)
						.setMinLength('4')
						.setMaxLength('25');

					const modal = new Modal()
						.setCustomId('ticket-modal')
						.setTitle('Halo kak, mau order apa?')
						.addComponents(new MessageActionRow().addComponents(modalComponent));

					await interaction.showModal(modal);
					break;

				case 'transcript-ticket':
					try {
						let channelMessages = await interaction.channel.messages.fetch({ limit: 100 });
						let messageCollection = new Collection();

						messageCollection = messageCollection.concat(channelMessages);

						let num = 1;
						let msglimit = 200;
						let messageLimit = Number(msglimit) / 100;

						if (Number(msglimit) === 0) {
							msglimit = 100;
						}

						if (messageLimit < 1) {
							messageLimit = 1;
						}

						while (channelMessages.size === 100) {
							let lastMessageId = channelMessages.lastKey();

							if (num === messageLimit) {
								break;
							}

							num += 1;

							channelMessages = await interaction.channel.messages.fetch({ limit: 100, before: lastMessageId });

							if (channelMessages) {
								messageCollection = messageCollection.concat(channelMessages);
							}
						}

						const msgToSave = messageCollection
							.reverse()
							.map((x) => {
								return `${x.createdAt.toLocaleString('en-ID')} - ${x.author.tag} : ${x.content} ${
									x.attachments.size !== 0 ? x.attachments.map((x) => x.attachment) : ''
								}`;
							})
							.join('\n');

						fs.writeFileSync(path.resolve(__dirname, `../../Assets/Transcript/transcript-${interaction.user.id}.txt`), msgToSave, 'utf-8');

						await interaction.reply({
							content: `Here's the transcript data for ${interaction.channel}`,
							files: [path.resolve(__dirname, `../../Assets/Transcript/transcript-${interaction.user.id}.txt`)],
						});

						fs.unlinkSync(path.resolve(__dirname, `../../Assets/Transcript/transcript-${interaction.user.id}.txt`));
					} catch (err) {
						console.log(err);
					}

					break;

				case 'close-ticket':
					try {
						const userData = await userSchema.findOne({ guildId: interaction.guild.id });
						await userSchema.findOneAndDelete({ guildId: userData?.guildId, userId: userData?.userId });

						const getChannel = interaction.guild.channels.cache.get(userData?.ticket.channelId);

						const userCloseEmbed = new MessageEmbed()
							.setAuthor({ name: 'Ticket Status: CLOSED', iconURL: this.client.user.displayAvatarURL() })
							.setColor('WHITE')
							.setDescription(['This ticket has been closed.'].join('\n'));

						const utilityButton = new MessageActionRow().addComponents(
							new MessageButton().setCustomId('delete-user-channel').setLabel('Delete Channel').setStyle('DANGER').setEmoji('⛔'),
							new MessageButton()
								.setCustomId('transcript-ticket')
								.setLabel('Transcript')
								.setEmoji('<:transcript:990906309182378015>')
								.setStyle('PRIMARY'),
						);

						getChannel.edit({
							permissionOverwrites: [
								{
									id: userData?.userId,
									deny: ['READ_MESSAGE_HISTORY', 'VIEW_CHANNEL'],
								},
								{
									id: interaction.guild.roles.everyone.id,
									deny: ['VIEW_CHANNEL'],
								},
							],
						});

						await interaction.reply({ embeds: [userCloseEmbed], components: [utilityButton] });
					} catch (err) {
						console.log(err);
					}

					break;

				case 'delete-user-channel':
					const getChannel = interaction.guild.channels.cache.get(interaction.channel.id);

					await interaction.reply({ content: 'This channel will be deleted in 5 seconds.' });

					setTimeout(() => {
						getChannel.delete();
					}, 5000);

					break;

				default:
					break;
			}
		}
	}
};
