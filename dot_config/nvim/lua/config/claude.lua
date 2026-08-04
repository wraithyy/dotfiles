-- Send context from nvim to a Claude Code session running in a sibling
-- tmux/herdr pane. No plugin: just send-keys. Complements <leader>cpc.

local M = {}

-- Find the tmux pane running Claude Code in the current session.
-- CC sets pane_title to "✳ Claude Code"; pane_current_command is unreliable
-- (reports the version string, e.g. "2.1.215"), so match on the title.
local function tmux_claude_pane()
	local self_pane = vim.env.TMUX_PANE
	-- tab-separated so titles with spaces stay intact
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
		-- literal text, then Enter as a separate key event
		vim.fn.system({ "tmux", "send-keys", "-t", pane, "-l", text })
		vim.fn.system({ "tmux", "send-keys", "-t", pane, "Enter" })
	else
		vim.notify("Not inside tmux or herdr", vim.log.levels.WARN)
		return
	end
	vim.notify("Sent to Claude", vim.log.levels.INFO)
end

-- @relative/path:Lstart-Lend for the current buffer (visual range or cursor line)
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

-- <leader>ap: type a prompt, auto-attach current file/selection reference
function M.prompt()
	vim.ui.input({ prompt = "Claude: " }, function(input)
		if input and input ~= "" then
			send(input .. " " .. file_ref())
		end
	end)
end

-- <leader>ae: send the diagnostic under the cursor as a fix request
function M.diagnostic()
	local line = vim.fn.line(".") - 1
	local diags = vim.diagnostic.get(0, { lnum = line })
	if #diags == 0 then
		vim.notify("No diagnostic on this line", vim.log.levels.WARN)
		return
	end
	local d = diags[1]
	local path = vim.fn.expand("%:.")
	local code = d.code and (" [" .. d.code .. "]") or ""
	send(("Fix this error at %s:%d%s: %s"):format(path, line + 1, code, d.message))
end

-- <leader>ar: send just the reference (normal = file, visual = range)
function M.reference()
	send(file_ref())
end

vim.keymap.set("n", "<leader>ap", M.prompt, { desc = "Claude: prompt + file ref" })
vim.keymap.set({ "n", "v" }, "<leader>ar", M.reference, { desc = "Claude: send file/selection ref" })
vim.keymap.set("n", "<leader>ae", M.diagnostic, { desc = "Claude: send diagnostic under cursor" })

return M
