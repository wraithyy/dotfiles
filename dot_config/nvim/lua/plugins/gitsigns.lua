require("which-key").add({
	{ "<leader>gh", desc = "GitSigns", icon = { icon = "󰞁", color = "red" } },
	{ "<leader>ghs", "<cmd>Gitsigns stage_hunk<CR>", desc = "Stage Hunk", icon = { icon = "󰥝", color = "orange" } },
	{ "<leader>ghr", "<cmd>Gitsigns reset_hunk<CR>", desc = "Reset Hunk", icon = { icon = "󰆴", color = "red" } },
	{ "<leader>ghp", "<cmd>Gitsigns preview_hunk<CR>", desc = "Preview Hunk", icon = "" },
	{ "<leader>ghb", "<cmd>Gitsigns blame_line<CR>", desc = "Blame Line", icon = "󰱩" },
})
return {
	{
		"lewis6991/gitsigns.nvim",
		dependencies = { "nvim-lua/plenary.nvim" }, -- Závislost, která je vyžadována
		event = { "BufReadPre", "BufNewFile" },
		cmd = { "Gitsigns" },
		opts = {}
	},
}
