const { connect, connection } = require('mongoose');

module.exports = class DatabaseConnection {
	constructor(client) {
		this.client = client;
	}

	init() {
		connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
			useFindAndModify: false,
		});

		connection.on('connected', () => {
			this.client.logger.ready(`Connected to ${connection.user} Database!`);
		});

		connection.on('disconnected', () => {
			this.client.logger.warn('Database connection lost!');
		});

		connection.on('err', (err) => {
			this.client.logger.err(`Database connection occured an error!\n${err.message}`);
		});
	}
};
