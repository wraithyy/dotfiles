require("which-key").add({
	{ "<leader>t", desc = "Treesitter/Twoslash", icon = "" },
	{ "<leader>ti", desc = "Initialize Treesitter selection", icon = "" },
	{ "<leader>tn", desc = "Next Treesitter selection (increment)", icon = "" },
	{ "<leader>tp", desc = "Previous Treesitter selection (decrement)", icon = "" },
})
return {
	{
		"nvim-treesitter/nvim-treesitter",
		build = ":TSUpdate",
		event = { "BufReadPost", "BufNewFile" },
		config = function()
			require("nvim-treesitter.configs").setup({
				-- Zde si nastavíš jazyky, které chceš používat
				ensure_installed = {
					"c",
					"lua",
					"python",
					"javascript",
					"typescript",
					"tsx",
					"markdown",
					"markdown_inline",
				}, -- Přidej zde jazyky, které chceš
				sync_install = false, -- Jazyky se budou instalovat asynchronně
				auto_install = true, -- Automatická instalace chybějících parsers
				indent = { enable = true },
				highlight = {
					enable = true, -- Zapni zvýrazňování syntaxe
					additional_vim_regex_highlighting = false, -- Zakáže použití regex zvýraznění spolu s treesitter
				},
				incremental_selection = {
					enable = true,
					keymaps = {
						init_selection = "<leader>ti",
						node_incremental = "<leader>tn",
						scope_incremental = false,
						node_decremental = "<leader>tp",
					},
				},
			})
		end,
	},
}
