require("which-key").add({
	{ "<leader>co", ":ColorizerToggle<CR>", desc = "Colorizer toggle", icon = { icon = "", color = "purple" } },
})
return {
	"norcalli/nvim-colorizer.lua",
	lazy = true,
	cmd = {
		"ColorizerToggle",
	},
	config = function()
		require("colorizer").setup({
			"css",
			"javascript",
			"typescript",
			"javascriptreact",
			"typescriptreact",
		}, {
			RGB = true, -- #RGB hex codes
			RRGGBB = true, -- #RRGGBB hex codes
			RRGGBBAA = true, -- #RRGGBBAA hex codes
			rgb_fn = true, -- CSS rgb() and rgba() functions
			hsl_fn = true, -- CSS hsl() and hsla() functions
			css = true, -- Enable all CSS features: rgb_fn, hsl_fn, names, RGB, RRGGBB
			css_fn = true, -- Enable all CSS *functions*: rgb_fn, hsl_fn
		})
	end,
}
