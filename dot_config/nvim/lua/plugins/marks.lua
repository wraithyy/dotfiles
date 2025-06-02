return {
	{
		"chentoast/marks.nvim",
		event = { "BufReadPre", "BufNewFile" },
		config = function()
			require("marks").setup({
				default_mappings = false, -- Disable default mappings
				builtin_marks = { ".", "<", ">", "^" }, -- Track specific built-in marks
				cyclic = true, -- Cycle through marks
				force_write_shada = false,
				refresh_interval = 250,
				sign_priority = { lower = 10, upper = 15, builtin = 8, bookmark = 20 },
				excluded_filetypes = { "help", "dashboard", "alpha" }, -- Ignore specific file types
				bookmark_0 = {
					sign = "⚑",
					virt_text = "Bookmark",
					annotate = false,
				},
				mappings = {
					-- Custom mappings for mark manipulation
					set_next = "m,", -- Set the next available mark
					next = "mj", -- Jump to the next mark
					prev = "mk", -- Jump to the previous mark
					delete_line = "md-", -- Delete the mark on the current line
					delete_buf = "md<space>", -- Delete all marks in the buffer
					preview = "mů", -- Preview the mark
					set_bookmark0 = "mé", -- Set bookmark 0
					delete_bookmark0 = "dmé", -- Delete bookmark 0
				},
			})
		end,
	},
}
