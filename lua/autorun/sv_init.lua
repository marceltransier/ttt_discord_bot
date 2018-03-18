if (!SERVER) then return end

inGame = false

local config_path = "addons/ttt_discord_bot/config.json"

if (!file.Exists(config_path,"GAME")) then
  error("config.json missing. ttt_discord_bot not correct installed.")
  return
end
local config = util.JSONToTable(file.Read(config_path,true))
if (config.mysql.host == "localhost") then config.mysql.host = "127.0.0.1" end

require( "mysqloo" )

db = mysqloo.connect(config.mysql.host, config.mysql.user, config.mysql.password, config.mysql.database, 3306 )
db:connect()

function db:onConnected()
    db:query("create table if not exists dead (nick varchar(255));create table if not exists muted (id varchar(255))"):start()--create tables if not exists
    addHooks()--add hooks after connected because the call the update function which needs the mysql connection
end
function db:onConnectionFailed( err )
    print( "ttt_discord_bot: Connection to database failed!" )
    print( "Error:", err )
end


function update()
  if (!inGame) then --if preparing or roundover -> clear dead table -> everybody can speak
    db:query("truncate dead;update updated set time="..CurTime()*1000):start()
    return
  end
  if (#player.GetAll() < 2) then return end
  if (#team.GetPlayers(TEAM_SPECTATOR) == 0) then return end
  local vals = ""
  for i, ply in ipairs(team.GetPlayers(TEAM_SPECTATOR)) do
		print(ply:Nick())
    vals = vals .. "('" .. ply:Nick() .. "')" ..((#team.GetPlayers(TEAM_SPECTATOR)==i) and "" or ",")
	end
  db:query("insert ignore into dead(nick) values"..vals..";update updated set time="..CurTime()*1000):start()--insert spectators in the dead table
end


function addHooks()
  hook.Add("TTTBeginRound", "ttt_discord_bot_TTTBeginRound", function()
    inGame = true
    update()
  end)
  hook.Add("TTTPrepareRound", "ttt_discord_bot_TTTPrepareRound", function()
    inGame = false
    update()
  end)
  hook.Add("TTTEndRound", "ttt_discord_bot_TTTEndRound", function()
    inGame = false
    update()
  end)
  hook.Add("PostPlayerDeath", "ttt_discord_bot_PostPlayerDeath", function()
    update()
  end)
end
