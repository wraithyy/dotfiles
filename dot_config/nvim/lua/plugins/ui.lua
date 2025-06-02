return {
	{
		"nvim-lualine/lualine.nvim",
		dependencies = {
			"echasnovski/mini.icons",
			"letieu/harpoon-lualine",
			"meuter/lualine-so-fancy.nvim",
		},
		lazy = false,
		opts = {
			theme = "catppuccin-mocha",
		},
		config = function()
			vim.g.screenkey_statusline_component = true

			require("lualine").setup({
				options = {
					theme = "catppuccin-mocha",
					globalstatus = true,
					always_divide_middle = false,
					section_separators = { left = "█", right = "█" },
					component_separators = { left = "󱋱", right = "󱋱" },
					-- disable_filetype = { "dashboard", "alpha", "neo-tree" },
				},
				sections = {
					lualine_a = {
						{ "fancy_mode", width = 8 },
					},
					lualine_b = {
						{ "fancy_branch" },
						-- {
						-- 	-- "harpoon2",
						-- 	active_indicators = { "󰬏", "󰬑", "󰬒", "󰬓" },
						-- 	indicators = { "󰰀", "󰰆", "󰰉", "󰰌" },
						-- },
					},
					lualine_c = {
						{ "fancy_diff" },
						{ "fancy_diagnostics" },
					},
					lualine_x = {

						{ "fancy_macro" },
						{ "fancy_searchcount" },
					},
					lualine_y = {

						{ "fancy_filetype", ts_icon = "" },
						{ "fancy_cwd", substitute_home = true },
						-- {
						-- 	function()
						-- 		local status = require("neocodeium").get_status()
						-- 		if status == 0 then
						-- 			return "󰘦" -- Ikona pro Enabled (zapnuto)
						-- 		elseif status == 1 then
						-- 			return "" -- Ikona pro Globally Disabled
						-- 		elseif status == 2 then
						-- 			return "󰓛" -- Ikona pro Buffer Disabled
						-- 		elseif status == 3 or status == 4 then
						-- 			return "" -- Ikona pro Filetype Disabled nebo options.enabled = false
						-- 		elseif status == 5 then
						-- 			return "⚠️" -- Ikona pro Wrong Encoding
						-- 		else
						-- 			return "" -- Prázdné, pokud není k dispozici status
						-- 		end
						-- 	end,
						-- 	color = function()
						-- 		local status = require("neocodeium").get_status()
						-- 		if status == 0 then
						-- 			return { fg = "#00FF00", gui = "bold" } -- Zelená pro Enabled
						-- 		elseif status == 1 then
						-- 			return { fg = "#FF0000", gui = "bold" } -- Červená pro Globally Disabled
						-- 		elseif status == 2 then
						-- 			return { fg = "#FF4500", gui = "bold" } -- Oranžová pro Buffer Disabled
						-- 		elseif status == 5 then
						-- 			return { fg = "#FFD700", gui = "bold" } -- Žlutá pro Wrong Encoding
						-- 		else
						-- 			return { fg = "#FFFFFF", gui = "bold" } -- Defaultní barva pro ostatní stavy
						-- 		end
						-- 	end,
						-- },
					},
					lualine_z = {
						{ "fancy_lsp_servers" },
						{ "fancy_location" },
					},
				},
			})
		end,
	},
	{
		"echasnovski/mini.icons",
		opts = {},
		lazy = true,
		specs = {
			{ "nvim-tree/nvim-web-devicons", enabled = false, optional = true },
		},
		init = function()
			package.preload["nvim-web-devicons"] = function()
				require("mini.icons").mock_nvim_web_devicons()
				return package.loaded["nvim-webdev-devicons"]
			end
		end,
	},
	{
		"catppuccin/nvim",
		name = "catppuccin",
		priority = 1000,
		lazy = false,
		opts = {
			transparent_background = true,
			color_overrides = {
				all = {
					-- Map your custom colors to Catppuccin equivalents
					peach = "#ee5d43", -- Color5
					green = "#96E072", -- Color6
					mauve = "#c74ded", -- Color4
					teal = "#00e8c6", -- Color1
					overlay0 = "#808085", -- Color0
					yellow = "#FFE66D", -- Color3
					orange = "#f39c12", -- Color2
				},
			},
			custom_highlights = function(colors)
				return {
					-- Apply specific colors from Catppuccin's palette based on your example
					Comment = { fg = colors.overlay0 }, -- Color0 mapped to overlay0
					Identifier = { fg = colors.teal }, -- Color1 mapped to teal
					Number = { fg = colors.peach }, -- Color2 mapped to peach
					Function = { fg = colors.yellow }, -- Color3 mapped to yellow
					Type = { fg = colors.mauve }, -- Color4 mapped to mauve
					Keyword = { fg = colors.mauve }, -- Color4 mapped to mauve
					Constant = { fg = colors.peach }, -- Color5 mapped to peach
					String = { fg = colors.green }, -- Color6 mapped to green

					MiniTablineCurrent = {
						fg = colors.teal,
						cterm = { underline = false },
						italic = true,
						underline = false,
					},
					-- Variables (updated to use colors.teal)
					TSVariable = { fg = colors.teal }, -- Variable names
					["@variable"] = { fg = colors.teal }, -- Variable names
					["@parameter"] = { fg = colors.teal }, -- Variable names
					["@variable.builtin"] = { fg = colors.teal }, -- Variable names
					["@variable.member"] = { fg = colors.yellow }, -- Variable names
					TSParameter = { fg = colors.teal }, -- Parameter names
					["@property"] = { fg = colors.teal }, -- Property names:
					["@type"] = { fg = colors.yellow }, -- Type names
					["@type.builtin"] = { fg = colors.overlay0 }, -- Type names
					Special = { fg = colors.peach }, -- Special characters
					["@tag"] = { fg = colors.peach }, -- Tag names
					["@tag.attribute.tsx"] = { fg = colors.yellow }, -- Tag names
					["@type.builtin.tsx"] = { fg = "#c5dEc9" }, -- Tag names
					["@lsp.type.interface"] = { fg = "#ffb1ad" }, -- Tag names
					-- Line numbers
					LineNr = { fg = colors.teal }, -- Regular line numbers

					BlinkCmpMenuBorder = { fg = colors.teal }, -- Cursor line number
					BlinkCmpMenuLabel = { fg = colors.teal }, -- Cursor line number
					CursorLineNr = { fg = colors.teal }, -- Current line number
					MarkSignHL = { fg = colors.yellow },

					-- Additional highlights directly with colors based on your Lua theme example
					WinSeparator = { fg = colors.teal }, -- Window separators
					NeoTreeWinSeparator = { fg = colors.teal }, -- Window separators
					FloatBorder = { fg = colors.teal }, -- Float border
					TSLabel = { fg = colors.mauve }, -- Type color
					TSProperty = { fg = colors.peach }, -- Constant color
					TSConstBuiltin = { fg = colors.peach }, -- Constant color
					Folded = { fg = colors.overlay0 }, -- Comment color for folded text
					TSField = { fg = colors.teal }, -- Field names as variables
					TSPunctBracket = { fg = colors.mauve }, -- Type color
					Repeat = { fg = colors.mauve }, -- Type color
					NonText = { fg = colors.overlay0 }, -- Comment color for non-text elements
					TSFunction = { fg = colors.yellow }, -- Function color
					TSNumber = { fg = colors.peach }, -- Number color
					TSKeyword = { fg = colors.mauve }, -- Keyword color
					TSTagDelimiter = { fg = colors.mauve }, -- Type color
					TelescopeNormal = { fg = colors.text, bg = colors.mantle }, -- Normal colors for Telescope
					TSConstant = { fg = colors.peach }, -- Constant color
					TSOperator = { fg = colors.peach }, -- Operator color
					TSConditional = { fg = colors.mauve }, -- Keyword color
					TSType = { fg = colors.mauve }, -- Type color
					TSNamespace = { fg = colors.mauve }, -- Type color
					Whitespace = { fg = colors.overlay0 }, -- Comment color for whitespace
					TSFuncMacro = { fg = colors.yellow }, -- Function color for macros
					Operator = { fg = colors.peach }, -- Keyword color for operators
					TSParameterReference = { fg = colors.teal }, -- Variables (parameters) in references
					TSString = { fg = colors.green }, -- String color
					Macro = { fg = colors.yellow }, -- Function color
					TSFloat = { fg = colors.peach }, -- Number color for floats
					TSRepeat = { fg = colors.mauve }, -- Keyword color for repeats
					TSComment = { fg = colors.overlay0 }, -- Comment color
					TSTag = { fg = colors.mauve }, -- Type color for tags
					TSPunctSpecial = { fg = colors.overlay1 }, -- Punctuation special color
					Conditional = { fg = colors.mauve }, -- Keyword color for conditionals
					WilderMauve = { fg = colors.teal }, -- Wilder highlight color
					WilderText = { fg = colors.text, bg = colors.overlay0 }, -- Wilder highlight color
					WhichKeyValue = { fg = colors.peach }, -- WhichKey description color
					NeoTreeIndentMarker = { fg = "#303039" },
					TelescopeNormal = { bg = "none" },
					ZenBg = { bg = "none" },
					NeominimapBorder = { fg = colors.overlay0, bg = "none" },
				}
			end,
			integrations = {
				cmp = true,
				barbecue = {
					dim_dirname = true, -- directory name is dimmed by default
					bold_basename = true,
					dim_context = false,
					alt_background = false,
				},
				diffview = true,
				window_picker = true,
				which_key = true,
				neotree = true,
				leap = true,
				harpoon = true,
				mason = true,
				noice = true,
				blink_cmp = true,
				mini = {
					enabled = true,
					indentscope_color = "",
				},
				native_lsp = {
					enabled = true,
					virtual_text = {
						errors = { "italic" },
						hints = { "italic" },
						warnings = { "italic" },
						information = { "italic" },
						ok = { "italic" },
					},
					underlines = {
						errors = { "underline" },
						hints = { "underline" },
						warnings = { "underline" },
						information = { "underline" },
						ok = { "underline" },
					},
					inlay_hints = {
						background = true,
					},
				},
				notify = true,
				neogit = true,

				snacks = true,
			},
			config = function()
				vim.defer_fn(function()
					vim.cmd.colorscheme("catppuccin") -- Set Catppuccin as the colorscheme after configuration
				end, 0)
			end,
		},
	},
}
