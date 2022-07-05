const path = require('path');
const fs = require('fs').promises;
const { promisify } = require('util');
const glob = promisify(require('glob'));
const { Message } = require('discord.js');
const { default: fetch } = require('node-fetch');

const Command = require('./Command.js');
const Event = require('./Event');

module.exports = class Util {
	constructor(client) {
		this.client = client;
	}

	isClass(input) {
		return typeof input === 'function' && typeof input.prototype === 'object' && input.toString().substring(0, 5) === 'class';
	}

	get directory() {
		return `${path.dirname(require.main.filename)}${path.sep}`;
	}

	removeDuplicates(arr) {
		return [...new Set(arr)];
	}

	removeDupedLabel(arr) {
		const uniq = {};
		const arrFiltered = arr.filter((obj) => !uniq[(obj.label, obj.value)] && (uniq[(obj.label, obj.value)] = true));

		return arrFiltered;
	}

	capitalise(string) {
		return string
			.split(' ')
			.map((str) => str.slice(0, 1).toUpperCase() + str.slice(1))
			.join(' ');
	}

	notCapitalise(string) {
		return string
			.split(' ')
			.map((str) => str.slice(0, 1).toLowerCase() + str.slice(1))
			.join(' ');
	}

	checkOwner(target) {
		return this.client.config.client.owners.includes(target);
	}

	comparePerms(member, target) {
		return member.roles.highest.position < target.roles.highest.position;
	}

	rolePosition(message, target) {
		return message.guild.member(target).roles.highest.position > message.guild.member(this.client.user).roles.highest.position;
	}

	trimArray(arr, maxLen = 10) {
		if (arr.length > maxLen) {
			const len = arr.length - maxLen;
			arr = arr.slice(0, maxLen);
			arr.push(`${len} More...`);
		}
		return arr;
	}

	formatBytes(bytes) {
		if (bytes === 0) return '0 Bytes';
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
	}

	formatPerms(perm) {
		return perm
			.toLowerCase()
			.replace(/(^|"|_)(\S)/g, (s) => s.toUpperCase())
			.replace(/_/g, ' ')
			.replace(/Guild/g, 'Server')
			.replace(/Use Vad/g, 'Use Voice Activity');
	}

	formatArray(array, type = 'conjunction') {
		return new Intl.ListFormat('en-GB', { style: 'short', type: type }).format(array);
	}

	categoryCheck(category, message) {
		category = category.toLowerCase();
		switch (category) {
			case 'owner':
				return this.checkOwner(message.author.id);
			case 'nsfw':
				return message.channel.nsfw;
			default:
				return true;
		}
	}

	boolSwitcher(bool) {
		if (typeof bool !== 'boolean') return 'The data that you input are not a Boolean!';

		return bool ? 'Yes' : 'No';
	}

	getMember(message, toFind = '') {
		toFind = toFind.toLowerCase();

		let target = message.guild.members.cache.get(toFind);

		if (!toFind) {
			target = message.member;
		}

		if (!target && message.mentions.members) target = message.mentions.members.first();

		if (!target && toFind) {
			target = message.guild.members.cache.find((member) => {
				return member.displayName.toLowerCase().includes(toFind) || member.user.tag.toLowerCase().includes(toFind);
			});
		}

		if (!target) {
			message.reply;
		}

		return target;
	}

	getChannel(message, toFind = '') {
		toFind = toFind.toLowerCase();

		let target = message.guild.channels.cache.get(toFind);

		if (!toFind) {
			target = message.channel;
		}

		if (!target && message.mentions.channels) target = message.mentions.channels.first();

		if (!target && toFind) {
			target = message.guild.channels.cache.find((channel) => {
				return channel.name.toLowerCase().includes(toFind.toLowerCase());
			});
		}

		if (!target) {
			this.inlineReply(message, false, null, "Im sorry, but i can't find that channel Name/ID!");
		}

		return target;
	}

	async loadSlashCommands() {
		return glob(`${this.directory}/Commands/**/*.js`).then((slashCmd) => {
			for (const slashFile of slashCmd) {
				delete require.cache[slashFile];
				const { name } = path.parse(slashFile);
				const File = require(slashFile);
				if (!this.isClass(File)) throw new TypeError(`Slash Command ${name} doesn't export a class.`);
				const slash = new File(this.client, name.toLowerCase());
				if (!(slash instanceof Command)) throw new TypeError(`Slash Command ${name} doesn't belong in slash commands.`);
				this.client.commands.set(slash.name, slash);
			}
		});
	}

	async loadEvents() {
		return glob(`${this.directory}Events/**/*.js`).then((events) => {
			for (const eventFile of events) {
				delete require.cache[eventFile];
				const { name } = path.parse(eventFile);
				const File = require(eventFile);
				if (!this.isClass(File)) throw new TypeError(`Event ${name} doesn't export a class!`);
				const event = new File(this.client, name);
				if (!(event instanceof Event)) throw new TypeError(`Event ${name} doesn't belong in Events`);
				this.client.events.set(event.name, event);
				event.emitter[event.type](name, (...args) => event.run(...args));
			}
		});
	}
};
