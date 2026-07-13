vim.o.autoread = true

local group = vim.api.nvim_create_augroup("auto_read", { clear = true })

vim.api.nvim_create_autocmd({ "FocusGained", "BufEnter", "CursorHold", "TermClose", "TermLeave" }, {
	group = group,
	callback = function()
		-- Don't run checktime in command-line mode; it can interrupt input.
		if vim.fn.mode() ~= "c" then
			vim.cmd("silent! checktime")
		end
	end,
})

vim.api.nvim_create_autocmd("FileChangedShellPost", {
	group = group,
	callback = function()
		vim.notify("File changed on disk, reloaded", vim.log.levels.WARN)
	end,
})
