local API_URL = "https://YOUR-APP.vercel.app/api/check"
local API_KEY = "your_secret_api_key"

addEventHandler("onPlayerJoin", root, function()
    local player = source
    local serial = getPlayerSerial(player)
    if not serial or serial == "" then
        kickPlayer(player, "Serial not found.")
        return
    end

    local url = API_URL .. "?key=" .. API_KEY .. "&serial=" .. serial

    fetchRemote(url, function(response, err)
        if err ~= 0 then
            outputChatBox("Whitelist check failed.", player, 255, 0, 0)
            kickPlayer(player, "Whitelist check error")
            return
        end
        local data = fromJSON(response)
        if not data or not data.approved then
            outputChatBox("You are not whitelisted. Apply on our website.", player, 255, 0, 0)
            kickPlayer(player, "Not whitelisted")
        end
    end, "GET")
end)