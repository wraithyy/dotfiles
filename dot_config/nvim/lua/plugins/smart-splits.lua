return {
	"mrjones2014/smart-splits.nvim",
	config = function()
		require("smart-splits").setup({
			multiplexer = "tmux",
			ignored_filetypes = {
				"neo-tree",
				"NvimTree",
				"Outline",
				"aerial",
				"undotree",
				"qf",
				"toggleterm",
				"TelescopePrompt",
				"alpha",
			},
			ignored_buftypes = { "nofile", "prompt", "popup" },
		})
		vim.keymap.set(
			"n",
			"<A-h>",
			':lua require("smart-splits").move_cursor_left()<CR>',
			{ noremap = true, silent = true, desc = "Move cursor left" }
		)
		vim.keymap.set(
			"n",
			"<A-j>",
			':lua require("smart-splits").move_cursor_down()<CR>',
			{ noremap = true, silent = true, desc = "Move cursor down" }
		)
		vim.keymap.set(
			"n",
			"<A-k>",
			':lua require("smart-splits").move_cursor_up()<CR>',
			{ noremap = true, silent = true, desc = "Move cursor up" }
		)
		vim.keymap.set(
			"n",
			"<A-l>",
			':lua require("smart-splits").move_cursor_right()<CR>',
			{ noremap = true, silent = true, desc = "Move cursor right" }
		)
		vim.keymap.set(
			"n",
			"<A-Left>",
			':lua require("smart-splits").resize_left()<CR>',
			{ noremap = true, silent = true, desc = "Resize culeft" }
		)
		vim.keymap.set(
			"n",
			"<A-Down>",
			':lua require("smart-splits").resize_down()<CR>',
			{ noremap = true, silent = true, desc = "Resize down" }
		)
		vim.keymap.set(
			"n",
			"<A-Up>",
			':lua require("smart-splits").resize_up()<CR>',
			{ noremap = true, silent = true, desc = "Resize up" }
		)
		vim.keymap.set(
			"n",
			"<A-Right>",
			':lua require("smart-splits").resize_right()<CR>',
			{ noremap = true, silent = true, desc = "Resize right" }
		)
	end,
}
