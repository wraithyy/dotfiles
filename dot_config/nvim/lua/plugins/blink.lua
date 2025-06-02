local trigger_text = "!"
return {
	{
		"saghen/blink.compat",
		version = false,
	},
	{

		"hrsh7th/nvim-cmp",
		optional = true,
		enabled = false,
	},
	{
		"saghen/blink.cmp",
		enabled = true,
		version = "1.*",
		-- version = "*",
		-- version = "v0.11.0",
		build = "cargo build --release",
		event = { "CmdlineEnter", "InsertEnter" },
		dependencies = {
			{
				"L3MON4D3/LuaSnip",
				version = "v2.*",
			},
			"mikavilpas/blink-ripgrep.nvim",
			"moyiz/blink-emoji.nvim",
			{ "saghen/blink.compat", lazy = true, version = false },
		},
		---@module 'blink.cmp'
		---@type blink.cmp.Config
		opts = {
			sources = {
				per_filetype = {
					codecompanion = { "codecompanion" }, -- <<< jen CodeCompanion zdroj
				},
				default = {
					"lazydev",
					"lsp",
					"path",
					"buffer",
					"snippets",
					"buffer",
					"ripgrep",
					"emoji",
					"obsidian",
					"obsidian_tags",
					"obsidian_new",
					"avante_commands",
					"avante_mentions",
					"avante_files",
				},
				providers = {
					avante_commands = {
						name = "avante_commands",
						module = "blink.compat.source",
						score_offset = 90, -- show at a higher priority than lsp
						opts = {},
					},
					avante_files = {
						name = "avante_files",
						module = "blink.compat.source",
						score_offset = 100, -- show at a higher priority than lsp
						opts = {},
					},
					avante_mentions = {
						name = "avante_mentions",
						module = "blink.compat.source",
						score_offset = 1000, -- show at a higher priority than lsp
						opts = {},
					},
					lazydev = {
						name = "LazyDev",
						module = "lazydev.integrations.blink",
						-- make lazydev completions top priority (see `:h blink.cmp`)
						score_offset = 100,
					},
					-- codecompanion = {
					-- 	name = "CodeCompanion",
					-- 	module = "codecompanion.integrations.blink",
					-- 	score_offset = 100,
					-- 	min_keyword_length = 0,
					-- },
					lsp = {
						name = "lsp",
						enabled = true,
						module = "blink.cmp.sources.lsp",
						-- kind = "LSP",
						-- When linking markdown notes, I would get snippets and text in the
						-- suggestions, I want those to show only if there are no LSP
						-- suggestions
						-- Disabling fallbacks as my snippets woudlnt show up
						-- fallbacks = { "luasnip", "buffer" },
						score_offset = 90, -- the higher the number, the higher the priority
					},
					-- snippets = {
					-- 	name = "snippets",
					-- 	enabled = true,
					-- 	max_items = 4,
					-- 	module = "blink.cmp.sources.snippets",
					-- 	min_keyword_length = 3,
					-- 	score_offset = 85, -- the higher the number, the higher the priority
					-- },
					snippets = {
						name = "snippets",
						enabled = true,
						-- max_items = 8,
						min_keyword_length = 2,
						module = "blink.cmp.sources.snippets",
						score_offset = 85, -- the higher the number, the higher the priority
						-- Only show snippets if I type the trigger_text characters, so
						-- to expand the "bash" snippet, if the trigger_text is ";" I have to
						should_show_items = function()
							local col = vim.api.nvim_win_get_cursor(0)[2]
							local before_cursor = vim.api.nvim_get_current_line():sub(1, col)
							-- NOTE: remember that `trigger_text` is modified at the top of the file
							return before_cursor:match(trigger_text .. "%w*$") ~= nil
						end,
						-- After accepting the completion, delete the trigger_text characters
						-- from the final inserted text
						transform_items = function(_, items)
							local col = vim.api.nvim_win_get_cursor(0)[2]
							local before_cursor = vim.api.nvim_get_current_line():sub(1, col)
							local trigger_pos = before_cursor:find(trigger_text .. "[^" .. trigger_text .. "]*$")
							if trigger_pos then
								for _, item in ipairs(items) do
									item.textEdit = {
										newText = item.insertText or item.label,
										range = {
											start = { line = vim.fn.line(".") - 1, character = trigger_pos - 1 },
											["end"] = { line = vim.fn.line(".") - 1, character = col },
										},
									}
								end
							end
							-- NOTE: After the transformation, I have to reload the luasnip source
							-- Otherwise really crazy shit happens and I spent way too much time
							-- figurig this out
							vim.schedule(function()
								require("blink.cmp").reload("snippets")
							end)
							return items
						end,
					},
					path = {
						name = "Path",
						module = "blink.cmp.sources.path",
						score_offset = 30,
						min_keyword_length = 2,
						-- When typing a path, I would get snippets and text in the
						-- suggestions, I want those to show only if there are no path
						-- suggestions
						fallbacks = { "snippets", "buffer" },
						should_show_items = function()
							return vim.bo.filetype ~= "codecompanion"
						end,
						opts = {
							trailing_slash = false,
							label_trailing_slash = true,
							get_cwd = function(context)
								return vim.fn.expand(("#%d:p:h"):format(context.bufnr))
							end,
							show_hidden_files_by_default = true,
						},
					},
					buffer = {
						name = "Buffer",
						enabled = true,
						max_items = 3,
						module = "blink.cmp.sources.buffer",
						min_keyword_length = 4,
						score_offset = 20,
					},
					ripgrep = {
						module = "blink-ripgrep",
						name = "Ripgrep",
						score_offset = 15,
						should_show_items = function()
							return vim.bo.filetype ~= "codecompanion"
						end,
						-- the options below are optional, some default values are shown
						---@module "blink-ripgrep"
						---@type blink-ripgrep.Options
						transform_items = function(_, items)
							for _, item in ipairs(items) do
								-- example: append a description to easily distinguish rg results
								item.labelDetails = {
									description = "(rg)",
								}
							end
							return items
						end,
					},
					-- https://github.com/moyiz/blink-emoji.nvim
					emoji = {
						module = "blink-emoji",
						name = "Emoji",
						score_offset = 15, -- the higher the number, the higher the priority
						opts = { insert = true }, -- Insert emoji (default) or complete its name
					},
					obsidian = {
						name = "obsidian",
						module = "blink.compat.source",
					},
					obsidian_new = {
						name = "obsidian_new",
						module = "blink.compat.source",
					},
					obsidian_tags = {
						name = "obsidian_tags",
						module = "blink.compat.source",
					},
					-- Example on how to configure dadbod found in the main repo
					-- https://github.com/kristijanhusak/vim-dadbod-completion
					-- dadbod = {
					-- 	name = "Dadbod",
					-- 	module = "vim_dadbod_completion.blink",
					-- 	score_offset = 85, -- the higher the number, the higher the priority
					-- },
					-- Third class citizen mf always talking shit
					-- copilot = {
					-- 	name = "copilot",
					-- 	enabled = true,
					-- 	module = "blink-cmp-copilot",
					-- 	-- kind = "Copilot",
					-- 	min_keyword_length = 6,
					-- 	score_offset = -100, -- the higher the number, the higher the priority
					-- 	async = true,
					-- },
				},
				-- -- command line completion, thanks to dpetka2001 in reddit
				-- -- https://www.reddit.com/r/neovim/comments/1hjjf21/comment/m37fe4d/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button
				-- cmdline = function()
				-- 	local type = vim.fn.getcmdtype()
				-- 	if type == "/" or type == "?" then
				-- 		return { "buffer" }
				-- 	end
				-- 	if type == ":" then
				-- 		return { "cmdline" }
				-- 	end
				-- 	return {}
				-- end,
			},
			snippets = {
				preset = "luasnip",
				expand = function(snippet)
					require("luasnip").lsp_expand(snippet)
				end,
				active = function(filter)
					if filter and filter.direction then
						return require("luasnip").jumpable(filter.direction)
					end
					return require("luasnip").in_snippet()
				end,
				jump = function(direction)
					require("luasnip").jump(direction)
				end,
			},
			cmdline = {
				keymap = {
					["<Tab>"] = { "accept", "fallback" },
					["<Down>"] = { "select_next", "fallback" },
					["<Up>"] = { "select_prev", "fallback" },
				},
				completion = {
					menu = { auto_show = true },
				},
				-- sources = function()
				-- 	local type = vim.fn.getcmdtype()
				-- 	if type == "/" or type == "?" then
				-- 		return { "buffer" }
				-- 	end
				-- 	if type == ":" then
				-- 		return { "cmdline" }
				-- 	end
				-- 	return {}
				-- end,
			},

			keymap = {
				preset = "enter",
				["<Tab>"] = { "fallback" },
				["<C-S-Space>"] = { "show" },
				["<S-CR>"] = { "hide" },
				["<CR>"] = { "select_and_accept", "fallback" },
				["<Down>"] = { "select_next", "fallback" },
				["<Up>"] = { "select_prev", "fallback" },
				["<PageDown>"] = { "scroll_documentation_down" },
				["<PageUp>"] = { "scroll_documentation_up" },
			},
			completion = {
				menu = {
					border = "rounded",
					draw = {
						columns = {
							{ "label", "label_description", gap = 2 },
							{ "kind_icon" },
						},
					},
				},
				documentation = { window = { border = "rounded" }, auto_show = true, auto_show_delay_ms = 500 },
			},
			fuzzy = { implementation = "prefer_rust_with_warning" },
			signature = { window = { border = "rounded" }, enabled = true },
		},
	},
}
