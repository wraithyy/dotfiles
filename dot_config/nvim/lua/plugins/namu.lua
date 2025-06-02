return {
	"bassamsdata/namu.nvim",
	config = function()
		require("namu").setup({
			namu_symbols = {
				enable = true,
				options = {
					AllowKinds = {
						typescriptreact = {
							-- React Components and Hooks
							"Function", -- Function Components
							"Variable", -- Hooks and Context
							"Interface", -- Props and other interfaces
							"TypeAlias", -- Type definitions
							"Constant", -- Constants and config
							"Class", -- Class Components
						},
						typescript = {
							"Function", -- Functions and methods
							"Variable", -- Variables including hooks
							"Interface", -- Interfaces
							"TypeAlias", -- Type definitions
							"Class", -- Classes
							"Enum", -- Enums
							"Constant", -- Constants
						},
						javascript = {
							"Function", -- Functions and methods
							"Variable", -- Variables including hooks
							"Class", -- Classes
							"Constant", -- Constants
						},
						javascriptreact = {
							"Function", -- Function Components
							"Variable", -- Hooks and Context
							"Class", -- Class Components
							"Constant", -- Constants
						},
					},
				},
			},
		})

		vim.keymap.set("n", "<leader>ss", ":Namu symbols<cr>", {
			desc = "Jump to LSP symbol",
			silent = true,
		})
	end,
}
