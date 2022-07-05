const chalk = require('chalk');
const moment = require('moment');

module.exports = class Logger {
	get getTime() {
		return `[${moment().format('HH:mm:ss')}]`;
	}

	ready(content) {
		return console.log(chalk.blue(`[READY] ${this.getTime} : ${content}`));
	}

	warn(content) {
		return console.log(chalk.yellow(`[WARN] ${this.getTime} : ${content}`));
	}

	cmd(content) {
		return console.log(chalk.whiteBright(`[CMD] ${this.getTime} : ${content}`));
	}

	err(content) {
		return console.log(chalk.red(`[ERR] ${this.getTime} : ${content}`));
	}
};
