require("which-key").add({
	{ "<leader>g", desc = "Git", icon = "󰊢" },
	{ "<leader>gg", desc = "Status", icon = "󰊢" },
	{ "<leader>gc", desc = "Commit", icon = "" },
})
return {
	"NeogitOrg/neogit",

	command = { "Neogit" },
	dependencies = {
		"nvim-lua/plenary.nvim", -- required
		"sindrets/diffview.nvim", -- optional - Diff integration
	},
	config = function()
		require("neogit").setup({
			integrations = {
				diffview = true, -- Enable integration with Diffview
			},
		})
		vim.keymap.set(
			"n",
			"<leader>gg",
			":Neogit kind=vsplit<CR>",
			{ noremap = true, silent = true, desc = "Open Neogit Status" }
		)
		vim.keymap.set(
			"n",
			"<leader>gc",
			":Neogit commit<CR>",
			{ noremap = true, silent = true, desc = "Open Neogit Commit" }
		)
		vim.keymap.set("n", "<leader>gp", ":Neogit push<CR>", { noremap = true, silent = true, desc = "Push Changes" })
		vim.keymap.set("n", "<leader>gr", ":Neogit rebase<CR>", { noremap = true, silent = true, desc = "Rebase" })
		vim.keymap.set("n", "<leader>gm", ":Neogit merge<CR>", { noremap = true, silent = true, desc = "Merge Branch" })
		vim.keymap.set(
			"n",
			"<leader>gC",
			":Neogit cherry_pick<CR>",
			{ noremap = true, silent = true, desc = "Cherry-pick Commit" }
		)
	end,
}
