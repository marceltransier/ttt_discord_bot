if (!SERVER) then return end

local config_path = "addons/ttt_discord_bot/config.json"

if (!file.Exists(config_path,"GAME")) then
  error("config.json missing. ttt_discord_bot not correct installed.")
  return
end
local config = util.JSONToTable(file.Read(config_path,true))
if (config.mysql.host == "localhost") then config.mysql.host = "127.0.0.1" end

require( "mysqloo" )

db = mysqloo.connect(config.mysql.host, config.mysql.user, config.mysql.password, config.mysql.database, 3306 )--TODO: use prepared querys to prevent sql injection
db:connect()

function db:onConnected()
    db:query("create table if not exists players (steamid varchar(255),discordid varchar(255) PRIMARY KEY,discordtag varchar(255),dead bool default 0,muted bool default 0)"):start()--create table if not exists
end
function db:onConnectionFailed( err )
    print( "ttt_discord_bot: Connection to database failed!" )
    print( "Error:", err )
end


function update()
  print("update:")
  if (GetRoundState() != 3) then --if preparing or roundover -> everybody can speak
    db:query("update players set dead=0"):start()
    return
  end
  if (#team.GetPlayers(TEAM_SPECTATOR) != 0) then
    local where = ""
    for i, ply in ipairs(team.GetPlayers(TEAM_SPECTATOR)) do
      where = where .. "steamid = '" .. ply:SteamID() .. "'" ..((#team.GetPlayers(TEAM_SPECTATOR)==i) and " " or " or ")
  	end
    db:query("update players set dead=1 where "..where):start()
  end

  local query = db:query("select steamid from players where dead=1")
  function query:onSuccess(data)
    for i,row in pairs(data) do
  		local steamid = row["steamid"]
      local isSpectator = false
      for j,ply in ipairs(team.GetPlayers(TEAM_SPECTATOR)) do
        if ply:SteamID() == steamid then
          isSpectator = true
        end
      end
      if !isSpectator then
        db:query("update players set dead=0 where steamid='"..steamid.."'"):start()
      end
  	end
  end
  query:start()

end

function cmd(msg,ply)
  if (string.sub(msg,1,9) != '!discord ') then return end
  tag = string.sub(msg,10)

  print(tag)

  local query_count = db:query("select discordtag from players where discordtag like '%"..tag.."%'")
  function query_count:onSuccess(data)
    PrintTable(data)
    local count = #data
    if (count == 0) then
      ply:PrintMessage(HUD_PRINTTALK, "No discord user with a tag like '"..tag.."' found. (Are you in the right voice-channel?)")
    elseif (count > 1) then
      ply:PrintMessage(HUD_PRINTTALK, "Found more than one user with a discord tag like '"..tag.."'. Please specify!")
    else
      local steamid = ply:SteamID()

      local query_update = db:query("update players set steamid=NULL where steamid='"..steamid.."';update players set steamid='"..steamid.."' where discordtag like '%"..tag.."%'")
      function query_update:onSuccess()
        ply:PrintMessage(HUD_PRINTTALK, "Discord tag '"..data[1]["discordtag"].."' successfully boundet to SteamID '"..steamid.."'")
      end
      query_update:start()

    end
  end
  query_count:start()

end

function welcome(ply)
  local query = db:query("select discordtag from players where steamid = '"..ply:SteamID().."'")
  function query:onSuccess(data)
    if (#data == 1 ) then
      if (data[1]["discordtag"]) then
        ply:PrintMessage(HUD_PRINTTALK, "You are connected with discord (tag: "..data[1]["discordtag"]..")")
        return
      end
    end
    ply:PrintMessage(HUD_PRINTTALK, "You are not connected with discord. Write '!discord DISCORDTAG' in the chat. E.g. '!discord marcel.js#4402'")
  end
  query:start()



end


hook.Add("TTTBeginRound", "ttt_discord_bot_TTTBeginRound", function()
  update()
end)
hook.Add("TTTEndRound", "ttt_discord_bot_TTTEndRound", function()
  update()
end)
hook.Add("PostPlayerDeath", "ttt_discord_bot_PostPlayerDeath", function()
  update()
end)
hook.Add("PlayerSpawn", "ttt_discord_bot_PlayerSpawn", function(ply)
  update()
  welcome(ply)
end)
hook.Add("PlayerDisconnected", "ttt_discord_bot_PlayerDisconnected", function()
  update()
end)
hook.Add("ShutDown","ttt_discord_bot_ShutDown", function()
  db:query("update players set dead=0"):start()
end)
hook.Add("PlayerSay", "ttt_discord_bot_PlayerSay", function(ply,msg)
  cmd(msg,ply)
end)
