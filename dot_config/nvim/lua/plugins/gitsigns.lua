return {
	{
		"lewis6991/gitsigns.nvim",
		dependencies = { "nvim-lua/plenary.nvim" }, -- Závislost, která je vyžadována
		event = { "BufReadPre", "BufNewFile" },
		cmd = { "Gitsigns" },
		keys = {
			{ "<leader>ghs", "<cmd>Gitsigns stage_hunk<CR>", desc = "Stage Hunk" },
			{ "<leader>ghr", "<cmd>Gitsigns reset_hunk<CR>", desc = "Reset Hunk" },
			{ "<leader>ghp", "<cmd>Gitsigns preview_hunk<CR>", desc = "Preview Hunk" },
			{ "<leader>ghb", "<cmd>Gitsigns blame_line<CR>", desc = "Blame Line" },
		},
		opts = {}
	},
}
