const Discord = require('discord.js');
const MySQL = require('mysql');
const config = require('../config.json');

const client = new Discord.Client();

client.on('ready', () => {
	console.log('Ready!');
});

client.login(config.discord.token);


client.on('message', message => {
	console.log(message.content);
});
