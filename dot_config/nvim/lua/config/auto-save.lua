vim.g.auto_save_enabled = true

vim.api.nvim_create_autocmd({ "InsertLeave", "TextChanged" }, {
	group = vim.api.nvim_create_augroup("auto_save", { clear = true }),
	callback = function()
		if not vim.g.auto_save_enabled then return end
		if vim.bo.buftype ~= "" or vim.bo.readonly or not vim.bo.modifiable then return end
		if vim.api.nvim_buf_get_name(0) == "" then return end
		vim.cmd("silent! update")
	end,
})

vim.keymap.set("n", "<leader>sf", function()
	vim.g.auto_save_enabled = not vim.g.auto_save_enabled
	vim.notify("Auto-save: " .. (vim.g.auto_save_enabled and "ON" or "OFF"))
end, { desc = "Toggle auto-save" })
