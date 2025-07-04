return {
	"stevearc/conform.nvim",
	event = "BufWritePre",
	opts = {
		formatters_by_ft = {
			javascript = { "biome", "eslint_d", "prettierd", stop_after_first = true },
			javascriptreact = { "biome", "eslint_d", "prettierd", stop_after_first = true },
			typescript = { "biome", "eslint_d", "prettierd", stop_after_first = true },
			typescriptreact = { "biome", "eslint_d", "prettierd", stop_after_first = true },
			mjs = { "biome", "eslint_d", "prettierd", stop_after_first = true },
			jsx = { "biome", "eslint_d", "prettierd", stop_after_first = true },
			json = { "biome", "prettierd", stop_after_first = true },
			jsonc = { "biome", "prettierd", stop_after_first = true },
			css = { "biome", "prettierd", stop_after_first = true },
			scss = { "prettierd" },
			lua = { "stylua" },
		},
		-- Fallback formátovače pro standalone soubory
		fallback_formatters = {
			javascript = { "prettierd" },
			javascriptreact = { "prettierd" },
			typescript = { "prettierd" },
			typescriptreact = { "prettierd" },
			json = { "prettierd" },
			jsonc = { "prettierd" },
			css = { "prettierd" },
		},
		formatters = {
			biome = {
				condition = function(ctx)
					return vim.fs.find(
						{ "biome.json", "biome.jsonc", ".biome.json", ".biome.jsonc" },
						{ path = ctx.filename, upward = true }
					)[1] ~= nil
				end,
			},
			eslint_d = {
				condition = function(ctx)
					local eslint_files = vim.fs.find({
						".eslintrc.js",
						".eslintrc.cjs",
						".eslintrc.json",
						".eslintrc.yaml",
						".eslintrc.yml",
						"eslint.config.js",
					}, { path = ctx.filename, upward = true })
					if #eslint_files > 0 then
						return true
					end
					local pkg = vim.fs.find("package.json", { path = ctx.filename, upward = true })[1]
					if pkg then
						local file = io.open(pkg, "r")
						if file then
							local content = file:read("*a")
							file:close()
							if content:find('"eslintConfig"') then
								return true
							end
						end
					end
					return false
				end,
			},
			prettierd = {}, -- fallback bez podmínky
		},
	},
	keys = {
		{
			"<leader>j",
			function()
				require("conform").format()
			end,
			desc = "Formátovat soubor (Conform)",
		},
		{
			"<leader>h",
			function()
				local conform = require("conform")
				local snacks = require("snacks")
				local available = conform.list_formatters(0)
				if #available == 0 then
					vim.notify("Žádný formátovač není dostupný pro tento soubor.", vim.log.levels.WARN)
					return
				elseif #available == 1 then
					conform.format({ formatters = { available[1].name } })
					return
				end
				local items = vim.tbl_map(function(fmt)
					return { text = fmt.name, formatter = fmt.name }
				end, available)
				snacks.picker({
					title = "Zvolte formátovač",
					layout = { preset = "default", preview = false },
					items = items,
					format = function(item, _)
						return { { item.text } }
					end,
					confirm = function(picker, item)
						picker:close()
						if item then
							conform.format({ bufnr = 0, formatters = { item.formatter } })
						end
					end,
				})
			end,
			desc = "Vybrat formátovací nástroj",
		},
	},
}
