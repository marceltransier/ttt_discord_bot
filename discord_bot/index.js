const Discord = require('discord.js');
const MySQL = require('mysql');
const config = require('../config.json');
const {log,error} = console;

var guild, channel;
var loggedin = false;
var lastupdate;

//create discord client
const client = new Discord.Client();
client.login(config.discord.token);

client.on('ready', () => {
	log('Bot is ready! :)');
	guild = client.guilds.find('id',config.discord.guild);
	channel = guild.channels.find('id',config.discord.channel);

	loggedin = true;
	update();
});
client.on('voiceStateUpdate',(oldMember,newMember) => {//when a user joins or leaves the voice channel, the update() function will be called
	if (oldMember.voiceChannel != newMember.voiceChannel && (oldMember.voiceChannelID == config.discord.channel || newMember.voiceChannelID == config.discord.channel))
		update()
});


//create mysql pool
var pool = MySQL.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
	multipleStatements: true
});

//create trables if not exists
mysql(`	create table if not exists dead (nick varchar(255));
				create table if not exists muted (id varchar(255));
				create table if not exists updated (time bigint)`,res => {
	mysql('select count(*) from updated',res => {
		if (res[0]["count(*)"] == 0)
			mysql('insert into updated(time) values('+Date.now()+')', () => checkDatabase());
		else
			checkDatabase();
	});
});
function checkDatabase() {
	mysql('select time from updated', res => {
		if (res[0].time != lastupdate) {
			lastupdate = res[0].time;
			update();
		}
		setTimeout(checkDatabase, config.check_frequency);
	});
}

function update() {//when the database has been updated or a user joined the channel, this function will check if the user should be muted or not
	if (!loggedin) return;

	let members = channel.members.array();

	mysql('select nick from dead',resDead => {
		mysql('select id from muted',resMuted => {
			for (row in resMuted) {//unmute if not more in dead table or voice channel
				let id = resMuted[row].id;

				let user = guild.members.find('id',id);
				let nick = user.nickname;
				let isDead = contains(resDead,nick,"nick")
				let isInChannel = contains(members,id,"id");

				if (!isDead || !isInChannel) muteUser(user,false);
			}
			for (row in resDead) {//mute if in dead table and in voice channel
				let nick = resDead[row].nick;

				let user = guild.members.find('nickname',nick);
				let isInChannel = contains(members,nick,"nickname");

				if (isInChannel) muteUser(user,true);
			}
		});
	})




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

function contains(array,entry,property=null) {
	for (i in array) {
		if (property) {
			if (array[i][property] == entry) return true;
		}else {
			if (array[i] == entry) return true;
		}
	}
	return false;
}

function debug(str) {
	if (config.debug) log(str);
}

function muteUser(user,mute) {//mute / unmute user and insert or delete userid from muted table. the muted table is needed to check whether a user (regardless of his current nickname) is muted by this bot and should get unmutet when he quit the voice channel
	user.setMute(mute,"dead players cant talk!")
	.then(() => {
		if (mute)
			mysql('insert ignore into muted(id) values('+user.id+')');
		else
			mysql('delete from muted where id='+user.id);
	}).catch(error);
}
