-- return {
-- 	"monkoose/neocodeium",
-- 	event = { "BufRead", "BufNewFile" },
-- 	config = function()
-- 		local neocodeium = require("neocodeium")
-- 		neocodeium.setup()
-- 		vim.keymap.set("i", "<C-CR>", function()
-- 			require("neocodeium").accept()
-- 		end, { desc = "Accept codeium suggestion", noremap = true, silent = true })
-- 		vim.keymap.set("i", "<S-C-CR>", function()
-- 			require("neocodeium").accept_word()
-- 		end, { desc = "Accept codeium suggestion word" })
-- 		-- vim.keymap.set("i", "<A-S-tab>", function()
-- 		-- 	require("neocodeium").accept_line()
-- 		-- end, { desc = "Accept codeium suggestion line" })
-- 		vim.keymap.set("i", "<A-c>", function()
-- 			require("neocodeium").cycle_or_complete()
-- 		end, { desc = "Cycle or complete codeium suggestion" })
-- 	end,
-- }
return {
	"Exafunction/codeium.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"hrsh7th/nvim-cmp",
	},
	config = function()
		require("codeium").setup({
			-- Optionally disable cmp source if using virtual text only
			enable_cmp_source = false,
			workspace_root = {
				find_root = function()
					return Snacks.git.get_root()
				end,
			},
			virtual_text = {
				enabled = true,

				-- These are the defaults

				-- Set to true if you never want completions to be shown automatically.
				manual = false,
				-- A mapping of filetype to true or false, to enable virtual text.
				filetypes = { codecompanion = false },
				-- Whether to enable virtual text of not for filetypes not specifically listed above.
				default_filetype_enabled = true,
				-- How long to wait (in ms) before requesting completions after typing stops.
				idle_delay = 75,
				-- Priority of the virtual text. This usually ensures that the completions appear on top of
				-- other plugins that also add virtual text, such as LSP inlay hints, but can be modified if
				-- desired.
				virtual_text_priority = 65535,
				-- Set to false to disable all key bindings for managing completions.
				map_keys = true,
				-- The key to press when hitting the accept keybinding but no completion is showing.
				-- Defaults to \t normally or <c-n> when a popup is showing.
				accept_fallback = nil,
				-- Key bindings for managing completions in virtual text mode.
				key_bindings = {
					-- Accept the current completion.
					accept = "<Tab>",
					-- Accept the next word.
					accept_word = "<A-Tab>",
					-- Accept the next line.
					accept_line = false,
					-- Clear the virtual text.
					clear = false,
					-- Cycle to the next completion.
					next = "<M-]>",
					-- Cycle to the previous completion.
					prev = "<M-[>",
				},
			},
		})
	end,
}
