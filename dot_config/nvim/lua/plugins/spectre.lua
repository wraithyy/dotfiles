require("which-key").add({
	{ "<leader>r", desc = "Replace", icon = { icon = "󰛔" } },
})
return {
	"nvim-pack/nvim-spectre",
	lazy = true,
	keys = {
		{
			"<leader>r",
			'<cmd>lua require("spectre").open_visual({select_word=true})<CR>',
			mode = { "n" },
			desc = "Replace",
		},
	},
	config = function()
		require("spectre").setup({
			is_block_ui_break = true,
			replace_engine = {
				["sed"] = {
					cmd = "sed",
					args = {
						"-i",
						"",
						"-E",
					},
				},
			},
		})
	end,
}
