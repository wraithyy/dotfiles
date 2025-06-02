return {

	{
		"echasnovski/mini.map",
		version = "*", -- použijte poslední stabilní verzi
		config = function()
			local map = require("mini.map")
			local diagnostic_integration = map.gen_integration.diagnostic({
				error = "@comment.error",
				warn = "@comment.warning",
				info = "@comment.note",
				hint = "@comment.hint",
				-- error = "TinyInlineDiagnosticVirtualTextError",
				-- warn = "TinyInlineDiagnosticVirtualTextWarn",
				-- info = "TinyInlineDiagnosticVirtualTextInfo",
				-- hint = "TinyInlineDiagnosticVirtualTextHint",
			})
			map.setup({
				-- Základní konfigurace
				integrations = {
					map.gen_integration.builtin_search(),
					-- map.gen_integration.diff(),
					diagnostic_integration,
					map.gen_integration.gitsigns(),
				},
				symbols = {
					encode = map.gen_encode_symbols.dot("4x2"), -- Značky pro zobrazení
				},
				window = {
					show_integration_count = false,
					focusable = false,
					side = "right", -- Zobrazení mapy na pravé straně
					width = 20, -- Šířka mapy
					winblend = 0,
				},
			})
			vim.api.nvim_create_autocmd("VimEnter", {
				callback = map.open,
			})

			vim.api.nvim_create_autocmd("WinClosed", {
				callback = map.refresh,
			})
		end,
	},
	-- {
	-- 	"echasnovski/mini.tabline",
	-- 	version = false,
	-- 	config = function()
	-- 		require("mini.tabline").setup({})
	-- 		vim.api.nvim_set_hl(0, "MiniTablineCurrent", {
	-- 			bg = "#1E1E2E",
	-- 			cterm = {
	-- 				bold = true,
	-- 				italic = true,
	-- 				underline = true,
	-- 			},
	-- 			italic = true,
	-- 			sp = "#00e8c6",
	-- 		})
	-- 	end,
	-- },
	{
		"echasnovski/mini.ai",
		config = function()
			local ai = require("mini.ai")
			ai.setup({
				custom_textobjects = {
					o = ai.gen_spec.treesitter({ -- code block
						a = { "@block.outer", "@conditional.outer", "@loop.outer" },
						i = { "@block.inner", "@conditional.inner", "@loop.inner" },
					}),
					f = ai.gen_spec.treesitter({ a = "@function.outer", i = "@function.inner" }), -- function
					c = ai.gen_spec.treesitter({ a = "@class.outer", i = "@class.inner" }), -- class
					t = { "<([%p%w]-)%f[^<%w][^<>]->.-</%1>", "^<.->().*()</[^/]->$" }, -- tags
					d = { "%f[%d]%d+" }, -- digits
					e = { -- Word with case
						{
							"%u[%l%d]+%f[^%l%d]",
							"%f[%S][%l%d]+%f[^%l%d]",
							"%f[%P][%l%d]+%f[^%l%d]",
							"^[%l%d]+%f[^%l%d]",
						},
						"^().*()$",
					},
					u = ai.gen_spec.function_call(), -- u for "Usage"
					U = ai.gen_spec.function_call({ name_pattern = "[%w_]" }), -- without dot in function name
				},
			})
		end,
	},
	{
		"echasnovski/mini.diff",
		event = "VeryLazy",
		keys = {
			{
				"<leader>go",
				function()
					require("mini.diff").toggle_overlay(0)
				end,
				desc = "Toggle mini.diff overlay",
			},
		},
		opts = function()
			Snacks.toggle({
				name = "Mini Diff Signs",
				get = function()
					return vim.g.minidiff_disable ~= true
				end,
				set = function(state)
					vim.g.minidiff_disable = not state
					if state then
						require("mini.diff").enable(0)
					else
						require("mini.diff").disable(0)
					end
					-- HACK: redraw to update the signs
					vim.defer_fn(function()
						vim.cmd([[redraw!]])
					end, 200)
				end,
			}):map("<leader>uG")
		end,
	},
}
