-- Send context from nvim to Claude Code in a sibling tmux/herdr pane.
-- Copy of main config's claude.lua minus the LSP diagnostic map (no LSP here).

local M = {}

-- CC sets pane_title to "✳ Claude Code"; pane_current_command is unreliable.
local function tmux_claude_pane()
	local self_pane = vim.env.TMUX_PANE
	local out = vim.fn.systemlist("tmux list-panes -s -F '#{pane_id}\t#{pane_title}'")
	for _, line in ipairs(out) do
		local id, title = line:match("^(%%%d+)\t(.*)$")
		if id and id ~= self_pane and title:lower():find("claude") then
			return id
		end
	end
	return nil
end

-- herdr detects agents natively: pane list JSON carries agent info per pane.
local function herdr_claude_pane()
	local out = vim.fn.system({ "herdr", "pane", "list" })
	local ok, decoded = pcall(vim.json.decode, out)
	if not ok then
		return nil
	end
	local panes = vim.tbl_get(decoded, "result", "panes") or decoded.panes or decoded
	if type(panes) ~= "table" then
		return nil
	end
	for _, p in ipairs(panes) do
		local id = p.pane_id or p.id
		if id and id ~= vim.env.HERDR_PANE_ID and vim.json.encode(p):lower():find("claude") then
			return id
		end
	end
	return nil
end

local function send(text)
	if vim.env.HERDR_ENV == "1" then
		local pane = herdr_claude_pane()
		if not pane then
			vim.notify("No Claude Code pane found in this herdr workspace", vim.log.levels.WARN)
			return
		end
		vim.fn.system({ "herdr", "pane", "send-text", pane, text })
		vim.fn.system({ "herdr", "pane", "send-keys", pane, "enter" })
	elseif vim.env.TMUX then
		local pane = tmux_claude_pane()
		if not pane then
			vim.notify("No Claude Code pane found in this tmux session", vim.log.levels.WARN)
			return
		end
		vim.fn.system({ "tmux", "send-keys", "-t", pane, "-l", text })
		vim.fn.system({ "tmux", "send-keys", "-t", pane, "Enter" })
	else
		vim.notify("Not inside tmux or herdr", vim.log.levels.WARN)
		return
	end
	vim.notify("Sent to Claude", vim.log.levels.INFO)
end

local function file_ref()
	local path = vim.fn.expand("%:.")
	local mode = vim.fn.mode()
	if mode:match("[vV\22]") then
		local s = vim.fn.line("v")
		local e = vim.fn.line(".")
		if s > e then
			s, e = e, s
		end
		return ("@%s:L%d-%d"):format(path, s, e)
	end
	return ("@%s"):format(path)
end

function M.prompt()
	vim.ui.input({ prompt = "Claude: " }, function(input)
		if input and input ~= "" then
			send(input .. " " .. file_ref())
		end
	end)
end

function M.reference()
	send(file_ref())
end

vim.keymap.set("n", "<leader>ap", M.prompt, { desc = "Claude: prompt + file ref" })
vim.keymap.set({ "n", "v" }, "<leader>ar", M.reference, { desc = "Claude: send file/selection ref" })

return M
