vim.g.auto_save_enabled = true

-- Skip saving when the buffer is a claudecode diff/preview buffer, or any
-- special (non-file) buffer.
local function should_skip(buf)
	if vim.bo[buf].buftype ~= "" then
		return true
	end
	if vim.b[buf].claudecode_diff then
		return true
	end
	local ft = vim.bo[buf].filetype or ""
	if ft:find("claudecode") then
		return true
	end
	local name = vim.api.nvim_buf_get_name(buf)
	if name == "" then
		return true
	end
	if name:find("claudecode") then
		return true
	end
	return false
end

local function do_save(buf)
	if not vim.g.auto_save_enabled then return end
	if not vim.api.nvim_buf_is_valid(buf) then return end
	if vim.bo[buf].readonly or not vim.bo[buf].modifiable then return end
	if should_skip(buf) then return end
	if not vim.bo[buf].modified then return end
	vim.api.nvim_buf_call(buf, function()
		vim.cmd("silent! update")
	end)
end

-- Debounce: coalesce rapid events into a single write after 250ms of quiet.
local timer = vim.uv.new_timer()

local function schedule_save(buf)
	if not vim.g.auto_save_enabled then return end
	if timer then
		timer:stop()
		timer:start(250, 0, vim.schedule_wrap(function()
			do_save(buf)
		end))
	end
end

vim.api.nvim_create_autocmd({ "InsertLeave", "FocusLost" }, {
	group = vim.api.nvim_create_augroup("auto_save", { clear = true }),
	callback = function(args)
		schedule_save(args.buf)
	end,
})

vim.keymap.set("n", "<leader>sf", function()
	vim.g.auto_save_enabled = not vim.g.auto_save_enabled
	vim.notify("Auto-save: " .. (vim.g.auto_save_enabled and "ON" or "OFF"))
end, { desc = "Toggle auto-save" })
