return {
	"folke/zen-mode.nvim",
	opts = {
		-- your configuration comes here
		-- or leave it empty to use the default settings
		-- refer to the configuration section below
		window = {
			backdrop = 0,
			width = 140,
		},
		wezterm = {
			enabled = true,
		},
	},
	keys = { { "<leader>zz", "<cmd>ZenMode<CR>", desc = "Toggle zen mode" } },
}
