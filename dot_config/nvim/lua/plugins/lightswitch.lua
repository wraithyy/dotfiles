require("which-key").add({
	{ "<leader>lt", "<cmd>LightSwitch<CR>", desc = "LightSwitch" },
})
return {

	"markgandolfo/lightswitch.nvim",
	dependencies = { "MunifTanjim/nui.nvim" },
	cmd = { "LightSwitch" },
	config = function()
		require("lightswitch").setup({
			toggles = {
				{
					name = "Formatting",
					enable_cmd = "lua vim.g.format_on_save = true",
					disable_cmd = "lua vim.g.format_on_save = false",
					state = true,
				},
				{
					name = "Colorizer",
					enable_cmd = "ColorizerEnable",
					disable_cmd = "ColorizerDisable",
					state = false,
				},
			},
		})
	end,
}
