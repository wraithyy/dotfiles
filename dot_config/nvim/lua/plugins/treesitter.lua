return {
	{
		"nvim-treesitter/nvim-treesitter",
		branch = "main", -- byl master; master je zamrzlý a nefunguje na nvim 0.12
		build = ":TSUpdate",
		event = { "BufReadPost", "BufNewFile" },
		init = function()
			-- ensure_installed už v main neexistuje → instalujeme install() API sami,
			-- s diffem proti nainstalovaným ať se parsery nereinstalují na každém startu
			local ensure = {
				"astro",
				"c",
				"lua",
				"python",
				"javascript",
				"typescript",
				"tsx",
				"markdown",
				"markdown_inline",
				-- FE/web + tooling (parita se starým auto-install setupem)
				"html",
				"css",
				"json",
				"yaml",
				"toml",
				"vue",
				"graphql",
				"bash",
				"dockerfile",
				"gitignore",
				"diff",
				"regex",
				"xml",
				"vimdoc",
			}
			local installed = require("nvim-treesitter.config").get_installed()
			local todo = vim.iter(ensure)
				:filter(function(parser)
					return not vim.tbl_contains(installed, parser)
				end)
				:totable()
			if #todo > 0 then
				require("nvim-treesitter").install(todo)
			end

			-- highlight + indent se v main zapínají per-buffer, ne přes setup()
			vim.api.nvim_create_autocmd("FileType", {
				group = vim.api.nvim_create_augroup("my_treesitter", { clear = true }),
				callback = function()
					pcall(vim.treesitter.start)
					vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
				end,
			})
		end,
	},
}
