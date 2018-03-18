# TTT Discord Bot
![downloads](https://img.shields.io/github/downloads/marceltransier/ttt_discord_bot/total.svg)
![license](https://img.shields.io/github/license/marceltransier/ttt_discord_bot.svg)

A [Discord-Bot](https://discord.js.org) that mutes dead players in [TTT](http://ttt.badking.net/) so they can't tell the others who the murderer is. :mute:

![Icon](images/icon/icon_64x.png)

## Getting Started

### Prerequisites
You have to have allready installed a Garry's Mod Server with the TTT Gamemode


### Installation
1. Clone this repository

   - copy this repository to your addons folder (`garrysmod/addons`) and navigate to it
     ```bash
     git clone https://github.com/marceltransier/ttt_discord_bot.git
     cd ttt_discord_bot
     ```
2. Create config.json

   - rename the `config-template.json` to `config.json`
     ```bash
     mv config-template.json config.json
     ```

3. Create Discord Bot, invite him to your server and paste the token in the config

   - if you don't know how to, follow [this guide](https://github.com/reactiflux/discord-irc/wiki/Creating-a-discord-bot-&-getting-a-token)
   
   - insert the bot token at `discord -> token` in the config.json
   
4. Insert the Guild (Server) id and the channel id in the config

   - if you don't know how to get these id's, follow [this guide](https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-)
   
   - insert the guild id at `discord -> guild` and the cannel id of the voice channel in wich the bot should mute dead players at `discord -> channel` in the config.json
   
5. Install and set up MySQL

   - Install [MySQL](https://www.mysql.com/)
     ```bach
     apt-get install mysql
     ```
   - Create user, create database and grand user privileges on the database
     ```sql
     CREATE USER 'ttt_discord_bot'@'localhost' IDENTIFIED BY 'insert-a-password-here';
     CREATE DATABASE db_ttt_discord_bot;
     GRANT ALL PRIVILEGES ON db_ttt_discord_bot.* TO 'ttt_discord_bot'@'localhost';
     ```
   - insert the MySQL host, user, password and database in the config.json
   
6. Install [Mysqloo](https://github.com/FredyH/MySQLOO)
   - just follow the [install instructions](https://github.com/FredyH/MySQLOO/blob/master/README.md#install-instructions)
   
7. Install the discord bot
   - install node.js if you haven't allready
     ```bach
     apt-get install nodejs
     ```
   - install the requirements
     ```bach
     npm install --prefix ./discord_bot
     ```

### Usage
To start the bot run node with the `discord_bot` directory
```bash
node garrysmod/addons/ttt_discord_bot/discord_bot
```

Use in Discord the same nickname as in steam.

You are only muted when you are dead in TTT and in the Discord channel which is configured in the config.json


## Contributing

1. Fork it (<https://github.com/marceltransier/ttt_discord_bot/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
