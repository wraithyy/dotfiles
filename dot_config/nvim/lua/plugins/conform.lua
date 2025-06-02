return {
		"stevearc/conform.nvim",
		event = "BufWritePre", -- nebo jiná vhodná událost pro lazy load
		opts = {
			-- Přiřazení formátovačů k jednotlivým typům souborů (v pořadí preference)
			formatters_by_ft = {
				javascript = { "biome", "eslint_d", "prettierd", stop_after_first = true },
				javascriptreact = { "biome", "eslint_d", "prettierd", stop_after_first = true },
				typescript = { "biome", "eslint_d", "prettierd", stop_after_first = true },
				typescriptreact = { "biome", "eslint_d", "prettierd", stop_after_first = true },
				json = { "biome", "prettierd", stop_after_first = true },
				jsonc = { "biome", "prettierd", stop_after_first = true },
				css = { "biome", "prettierd", stop_after_first = true },
				scss = { "prettierd" }, -- Biome aktuálně nepodporuje SCSS, použijeme rovnou Prettier
				lua = { "stylua" },
			},
			-- Konfigurace jednotlivých formátovačů (podmínky, argumenty apod.)
			formatters = {
				-- Biome: použije se, pokud je nalezen konfigurační soubor Biome v projektu
				biome = {
					condition = function(ctx)
						-- Hledá biome.json nebo biome.jsonc v aktuálním nebo nadřazených adresářích
						return vim.fs.find(
							{ "biome.json", "biome.jsonc", ".biome.json", ".biome.jsonc" },
							{ path = ctx.filename, upward = true }
						)[1] ~= nil
					end,
					-- (Není nutné specifikovat command/args, Conform má vestavěnou definici pro Biome,
					-- která typicky spouští `biome format --stdin-file-path=<file>`.)
				},
				-- ESLint_d: použije se, pokud existuje ESLint konfigurace v projektu
				eslint_d = {
					condition = function(ctx)
						-- Hledá běžné ESLint konfigurační soubory
						local eslint_files = vim.fs.find({
							-- typické názvy ESLint config souborů:
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
						-- Pokud žádný nenašel, zkusí zkontrolovat `package.json` s klíčem eslintConfig
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
					-- (Vestavěná definice spustí `eslint_d --fix` na daný soubor; Conform zajistí odchycení výstupu.)
				},
				-- Prettierd: není potřeba zvláštní podmínka (fallback vždy dostupný, pokud je nainstalován)
				prettierd = {
					-- Prettierd automaticky formátuje na základě konfigurace Prettier (pokud existuje .prettierrc, využije ji).
					-- Není třeba definovat condition (bude použit, pokud ostatní selžou nebo nejsou dostupné).
				},
			},
		},
		-- Zachování (nastavení) klávesových zkratek pro formátování
		keys = {
			-- <leader>j spustí automatické formátování souboru přes Conform (vybere preferovaný formátovač dle výše uvedených pravidel)
			{
				"<leader>j",
				function()
					require("conform").format()
				end,
				desc = "Formátovat soubor (Conform)",
			},
			-- <leader>h otevře výběr formátovače (snacks picker) pro ruční volbu nástroje
			{
				"<leader>h",
				function()
					local conform = require("conform")
					local snacks = require("snacks")
					local available = conform.list_formatters(0) -- dostupné formátovače pro aktuální buffer
					if #available == 0 then
						vim.notify("Žádný formátovač není dostupný pro tento soubor.", vim.log.levels.WARN)
						return
					elseif #available == 1 then
						-- Pokud je dostupný jen jeden formátovač, rovnou jej použij
						conform.format({ formatters = { available[1].name } })
						return
					end

					-- Použije snacks.picker k zobrazení seznamu formátovačů
					local items = vim.tbl_map(function(fmt)
						return { text = fmt.name, formatter = fmt.name }
					end, available)
					snacks.picker({
						title = "Zvolte formátovač",
						layout = { preset = "default", preview = false }, -- volitelná úprava layoutu
						items = items,
						format = function(item, _) -- jak zobrazit jednotlivé položky (zde jen text názvu)
							return { { item.text } }
						end,
						confirm = function(picker, item) -- akce po zvolení položky
							picker:close() -- zavřít picker
							if item then
								-- spustit formátování aktuálního bufferu vybraným formátovačem
								conform.format({ bufnr = 0, formatters = { item.formatter } })
							end
						end,
					})
				end,
				desc = "Vybrat formátovací nástroj",
			},
		},
}
