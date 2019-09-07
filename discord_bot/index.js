const Discord = require('discord.js');
const config = require('./config.json');
const {log,error} = console;
const http = require('http');
const fs = require('fs');

const PORT = config.server.port; //unused port and since now the OFFICIAL ttt_discord_bot port ;)

var guild, channel;

var muted = {};

var get = [];

//create discord client
const client = new Discord.Client();
client.login(config.discord.token);

client.on('ready', () => {
	log('Bot is ready to mute them all! :)');
	guild = client.guilds.get(config.discord.guild);
//	guild = client.guilds.find('id',config.discord.guild);
	channel = guild.channels.get(config.discord.channel);
//	channel = guild.channels.find('id',config.discord.channel);
});
client.on('voiceStateUpdate',(oldMember,newMember) => {//player leaves the ttt-channel
	if (oldMember.voiceChannel != newMember.voiceChannel && isMemberInVoiceChannel(oldMember)) {
		if (isMemberMutedByBot(newMember) && newMember.serverMute) newMember.setMute(false).then(()=>{
			setMemberMutedByBot(newMember,false);
		});
	}
});

isMemberInVoiceChannel = (member) => member.voiceChannelID == config.discord.channel;
isMemberMutedByBot = (member) => muted[member] == true;
setMemberMutedByBot = (member,set=true) => muted[member] = set;

get['connect'] = (params,ret) => {
	let tag_utf8 = params.tag.split(" ");
	let tag = "";

	tag_utf8.forEach(function(e) {
		tag = tag+String.fromCharCode(e);
	});

	let found = guild.members.filterArray(val => val.user.tag.match(new RegExp('.*'+tag+'.*')));
	if (found.length > 1) {
		ret({
			answer: 1 //pls specify
		});
	}else if (found.length < 1) {
		ret({
			answer: 0 //no found
		});
	}else {
		ret({
			tag: found[0].user.tag,
			id: found[0].id
		});
	}
};

get['mute'] = (params,ret) => {
	let id = params.id;
	let mute = params.mute
	if (typeof id !== 'string' || typeof mute !== 'boolean') {
		ret();
		return;
	}
	log("Muted: " + id);
	//let member = guild.members.find('id', id);
	let member = guild.members.find(user => user.id === id);

	if (member) {

		if (isMemberInVoiceChannel(member)) {
			if (!member.serverMute && mute) {
				member.setMute(true,"dead players can't talk!").then(()=>{
					setMemberMutedByBot(member);
					ret({
						success: true
					});
				}).catch((err)=>{
					ret({
						success: false,
						error: err
					});
				});
			}
			if (member.serverMute && !mute) {
				member.setMute(false).then(()=>{
					setMemberMutedByBot(member,false);
					ret({
						success: true
					});
				}).catch((err)=>{
					ret({
						success: false,
						error: err
					});
				});
			}
		}
		else {
			ret();
		}

	}else {
		ret({
			success: false,
			err: 'member not found!' //TODO lua: remove from ids table + file
		});
	}

}


http.createServer((req,res)=>{
	if (typeof req.headers.params === 'string' && typeof req.headers.req === 'string' && typeof get[req.headers.req] === 'function') {
		try {
			let params = JSON.parse(req.headers.params);
			get[req.headers.req](params,(ret)=>res.end(JSON.stringify(ret)));
		}catch(e) {
			res.end('no valid JSON in params');
		}
	}else
		res.end();
}).listen({
	port: PORT
},()=>{
	log('http interface is ready :)')
});
