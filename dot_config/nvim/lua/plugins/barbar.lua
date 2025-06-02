require("which-key").add({
	{ "<leader>bb", desc = "Pick buffers", cmd = "<cmd>BufferPick<CR>", icon = "﬘" }, -- "" icon = "﬘" },
	{ "<leader>bd", desc = "Delete buffer", cmd = "<cmd>BufferClose<CR>", icon = "" },
	{ "<leader>bD", desc = "Delete all buffers", cmd = "<cmd>BufferCloseAllButCurrentOrPinned<CR>", icon = "" },
	{ "<leader>bp", desc = "Pin buffer", cmd = "<cmd>BufferPin<CR>", icon = "﬘" },
})
return {
	"romgrk/barbar.nvim",
	dependencies = {
		"lewis6991/gitsigns.nvim", -- OPTIONAL: for git status
		"nvim-tree/nvim-web-devicons", -- OPTIONAL: for file icons
	},
	init = function()
		vim.g.barbar_auto_setup = false
	end,
	opts = {
		-- lazy.nvim will automatically call setup for you. put your options here, anything missing will use the default:
		animation = true,
		-- insert_at_start = true,
		-- …etc.
		icons = {
			-- Configure the base icons on the bufferline.
			-- Valid options to display the buffer index and -number are `true`, 'superscript' and 'subscript'
			buffer_index = false,
			buffer_number = false,
			button = "",
			-- Enables / disables diagnostic symbols
			diagnostics = {
				[vim.diagnostic.severity.ERROR] = { enabled = true },
				[vim.diagnostic.severity.WARN] = { enabled = false },
				[vim.diagnostic.severity.INFO] = { enabled = false },
				[vim.diagnostic.severity.HINT] = { enabled = true },
			},

			filetype = {
				-- Sets the icon's highlight group.
				-- If false, will use nvim-web-devicons colors
				custom_colors = false,

				-- Requires `nvim-web-devicons` if `true`
				enabled = true,
			},
			separator_at_end = true,

			-- If true, add an additional separator at the end of the buffer list

			-- Configure the icons on the bufferline when modified or pinned.
			-- Supports all the base icon options.
			modified = { button = "●" },
			pinned = { button = "", filename = true },

			-- Configure the icons on the bufferline based on the visibility of a buffer.
			-- Supports all the base icon options, plus `modified` and `pinned`.
			alternate = { filetype = { enabled = false } },
			inactive = { button = "×" },
			visible = { modified = { buffer_number = false } },
		},
		sidebar_filetypes = {
			-- Use the default values: {event = 'BufWinLeave', text = '', align = 'left'}
			NvimTree = true,
			["snacks_picker_list"] = true,
			-- Or, specify the text used for the offset:
			undotree = {
				text = "undotree",
				align = "center", -- *optionally* specify an alignment (either 'left', 'center', or 'right')
			},
			-- Or, specify the event which the sidebar executes when leaving:
			["neo-tree"] = { event = "BufWipeout" },
			-- Or, specify all three
			Outline = { event = "BufWinLeave", text = "symbols-outline", align = "right" },
		},
	},
	version = "^1.0.0", -- optional: only update when a new 1.x version is released
}
