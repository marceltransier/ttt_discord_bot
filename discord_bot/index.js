const Discord = require('discord.js');
const MySQL = require('mysql');
const config = require('../config.json');
const {log,error} = console;

var guild, channel;
var loggedin = false;
var lastqueryresult;

//create discord client
const client = new Discord.Client();
client.login(config.discord.token);

client.on('ready', () => {
	log('Bot is ready! :)');
	guild = client.guilds.find('id',config.discord.guild);
	channel = guild.channels.find('id',config.discord.channel);

	loggedin = true; //use client.status?? TODO
	update();
});
client.on('voiceStateUpdate',(oldMember,newMember) => {//player joins or leaves the ttt-channel
	if (oldMember.voiceChannel != newMember.voiceChannel && (isMemberInVoiceChannel(oldMember) || isMemberInVoiceChannel(newMember))) {
		updateDiscordTag(newMember);//update the discordtag to the steamid in the db
		update(lastqueryresult);
	}
});
client.on('guildMemberUpdate',(oldMember,newMember) => {
	if (isMemberInVoiceChannel(newMember))
		updateDiscordTag(newMember);//if somebody changes his discordtag while beeing in the ttt-voice-channel
})

//create mysql pool
var pool = MySQL.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  multipleStatements: false
});

//create trable if not exists
mysql('create table if not exists players (steamid varchar(255),discordid varchar(255) PRIMARY KEY,discordtag varchar(255),dead bool default 0,muted bool default 0)',res => {
	checkDatabase();
});
function checkDatabase() {
	mysql('select discordid,dead,muted from players', res => {
		if (JSON.stringify(res) != JSON.stringify(lastqueryresult)) {
			lastqueryresult = res;
			update(lastqueryresult);
		}
		setTimeout(checkDatabase, config['refresh-interval']);
	});
}

function updateDiscordTag(member) {
	mysql('insert into players(discordid,discordtag) values("'+member.id+'","'+member.user.tag+'") on duplicate key update discordtag="'+member.user.tag+'"');
}

function update(queryresult) {
	if (!loggedin) return;

	for (i in queryresult) { //loop all players in db
		let row = queryresult[i];
		let member = guild.members.find('id',row.discordid);
		if(member) {//if member is valid / exists
			// log(member.nickname);

			if (row.dead == 1 && isMemberInVoiceChannel(member)) //if member is dead and in the voice channel
				muteMember(member,true);
			if (row.muted == 1 && (row.dead == 0 || !isMemberInVoiceChannel(member))) //if member is muted and (not dead or not in the voice channel)
				muteMember(member,false);

		}
	}

}

//mysql query function
function mysql(sql,cb) {
	pool.getConnection(function(err, connection) {
		connection.query(sql, function (error, results, fields) {
			connection.release();
			if (error) throw error;
			if (cb) cb(results);
		});
	});
}

isMemberInVoiceChannel = (member) => member.voiceChannelID == config.discord.channel


function muteMember(member,mute) {
	member.setMute(mute,"dead players cant talk!")
	.then(() => {
		mysql('update players set muted='+(mute?'1':'0')+' where discordid="'+member.id+'"');
	}).catch(error);
}
