const path = require('path');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 5050;

const webApp = (client) => {
	app.set('view engine', 'ejs');

	app.set('views', path.join(__dirname, '../Public/Views'));
	app.use(express.static(path.join(__dirname, '../Public/Assets')));

	app.get('/', (req, res) => {
		res.render('main', { client: client });
	});

	app.listen(PORT, () => {
		client.logger.ready(`Web server is initialised and listening on port ${PORT}`);
	});
};

module.exports = { webApp };
