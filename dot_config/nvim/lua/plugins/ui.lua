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
					},
					lualine_c = {
						{ "fancy_diff" },
						{ "fancy_diagnostics" },
					},
					lualine_x = {

						{ "fancy_macro" },
						{ "fancy_searchcount" },
						{
							-- quickfix item counter (config/quickfix.lua M.counter)
							function()
								local ok, qf = pcall(require, "config.quickfix")
								return ok and qf.counter() or ""
							end,
							cond = function()
								return #vim.fn.getqflist() > 0
							end,
							icon = "",
						},
						{
							-- Claude Code websocket connection status
							function()
								local ok, cc = pcall(require, "claudecode")
								if not ok then
									return ""
								end
								local server = cc.state and cc.state.server
								return server and "󱚝 Claude" or ""
							end,
							color = { fg = "#00e8c6", gui = "bold" },
						},
					},
					lualine_y = {

						{ "fancy_filetype", ts_icon = "" },
						{ "fancy_cwd", substitute_home = true },
						{
							function()
								-- Copilot status (neocodeium/codeium removed)
								local ok, api = pcall(require, "copilot.api")
								if not ok then
									return ""
								end
								local status = api.status.data.status
								if status == "Normal" or status == "InProgress" then
									return "  Copilot"
								end
								return ""
							end,
							color = function()
								local copilot_ok, copilot_api = pcall(require, "copilot.api")
								if copilot_ok then
									local status = copilot_api.status.data.status
									if status == "Normal" then
										return { fg = "#00FF00", gui = "bold" }
									elseif status == "InProgress" then
										return { fg = "#FFD700", gui = "bold" }
									end
								end
								return { fg = "#00CED1", gui = "bold" }
							end,
						},
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
			flavour = "mocha", -- latte, frappe, macchiato, mocha
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

					-- UI overrides moved out of init.lua ColorScheme autocmd.
					-- custom_highlights persists across :colorscheme reapplies.
					SnacksPickerTree = { fg = "#3d3d52" },
					SnacksPickerList = { bg = "NONE" },
					SnacksPickerListCursorLine = { bg = "NONE" },
					NormalFloat = { bg = "NONE" },

					-- Diagnostic line highlights (wired via diagnostic signs.linehl).
					DiagnosticErrorLine = { bg = "#3c1f1e" },
					DiagnosticWarnLine = { bg = "#3c2e1e" },
					DiagnosticInfoLine = { bg = "#1e2e3c" },
					DiagnosticHintLine = { bg = "#1e3c2e" },
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
				flash = true,
				harpoon = true,
				mason = true,
				noice = true,
				blink_cmp = true,
				markview = true,
				snacks = {
					enabled = true,
					indent_scope_color = "", -- catppuccin color (eg. `lavender`) Default: text
				},
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
			},
		},
		config = function(_, opts)
			require("catppuccin").setup(opts)
			vim.cmd.colorscheme("catppuccin")
		end,
	},
}
