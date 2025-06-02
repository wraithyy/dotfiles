require("which-key").add({
	{ "<leader>ts", desc = "Two Slash Query", icon = "󱜹" },
})
return {
	"marilari88/twoslash-queries.nvim",
	opts = {
		highlight = "Type", -- to set up a highlight group for the virtual text
	},
	cmd = "TwoslashQueryEnable",
	keys = {
		{ "<leader>ts", "<cmd>TwoslashQueryEnable<CR>", desc = "Two Slash Query" },
	},
}
