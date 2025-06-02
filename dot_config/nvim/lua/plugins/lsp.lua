-- Kompletní moderní LSP config s podporou lazy.nvim a typescript-tools.nvim

local function lsp_highlight_document(client)
	if client.server_capabilities.documentHighlightProvider then
		local group = vim.api.nvim_create_augroup("lsp_document_highlight", { clear = true })
		vim.api.nvim_create_autocmd("CursorHold", {
			group = group,
			callback = function()
				vim.lsp.buf.document_highlight()
			end,
		})
		vim.api.nvim_create_autocmd("CursorMoved", {
			group = group,
			callback = function()
				vim.lsp.buf.clear_references()
			end,
		})
	end
end

local function on_attach(client, bufnr)
	local bufmap = function(mode, lhs, rhs, desc)
		vim.keymap.set(mode, lhs, rhs, { buffer = bufnr, desc = desc })
	end

	if client.name == "typescript-tools" then
		local ok, twoslash = pcall(require, "twoslash-queries")
		if ok then
			twoslash.attach(client, bufnr)
		end
	end

	lsp_highlight_document(client)

	bufmap("n", "K", vim.lsp.buf.hover, "Hover Documentation")
	bufmap("n", "gD", vim.lsp.buf.declaration, "Go to Declaration")
	bufmap("n", "<F2>", vim.lsp.buf.rename, "Rename Symbol")
	bufmap("n", "<F4>", vim.lsp.buf.code_action, "Code Actions")
	bufmap("n", "<leader>k", vim.lsp.buf.signature_help, "Signature Help")
	bufmap({ "n", "x" }, "<F3>", function()
		vim.lsp.buf.format({ async = true })
	end, "Format Document")
end

local capabilities = vim.lsp.protocol.make_client_capabilities()
local ok_cmp, blink = pcall(require, "blink.cmp")
if ok_cmp then
	capabilities = blink.get_lsp_capabilities(capabilities)
end

return {
	{
		"mason-org/mason.nvim",
		build = ":MasonUpdate",
		lazy = false,
		config = true,
	},
	{
		"mason-org/mason-lspconfig.nvim",
		event = { "BufReadPre", "BufNewFile" },
		dependencies = { "williamboman/mason.nvim" },
		opts = {
			ensure_installed = { "eslint", "rust_analyzer", "biome" },
			automatic_enable = false
		},
	},
	{
		"neovim/nvim-lspconfig",
		event = { "BufReadPre", "BufNewFile" },
		dependencies = {
			"williamboman/mason-lspconfig.nvim",
		},
		config = function()
			local lspconfig = require("lspconfig")

			local eslint_root = require("lspconfig.util").root_pattern(
				".eslintrc.js",
				".eslintrc.cjs",
				".eslintrc.json",
				".eslintrc.yaml",
				".eslintrc.yml",
				"eslint.config.js",
				"package.json"
			)

			local function has_eslint_config(root)
				local files = vim.fn.globpath(root, ".eslintrc.*", false, true)
				if #files > 0 then
					return true
				end
				return vim.fn.filereadable(root .. "/eslint.config.js") == 1
			end

			local function setup_eslint_if_needed()
				local cwd = vim.loop.cwd()
				local root = eslint_root(cwd)
				if root and has_eslint_config(root) then
					lspconfig.eslint.setup({
						on_attach = on_attach,
						capabilities = capabilities,
						root_dir = function()
							return root
						end,
					})
				end
			end

			setup_eslint_if_needed()

			lspconfig.rust_analyzer.setup({
				on_attach = on_attach,
				capabilities = capabilities,
			})

			lspconfig.biome.setup({
				on_attach = on_attach,
				capabilities = capabilities,
			})
		end,
	},
	{
		"pmizio/typescript-tools.nvim",
		event = { "BufReadPre", "BufNewFile" },
		dependencies = { "nvim-lua/plenary.nvim" },
		opts = {
			on_attach = on_attach,
			capabilities = capabilities,
			settings = {
				separate_diagnostic_server = false,
				publish_diagnostic_on = "insert_leave",
				tsserver_file_preferences = {
					includeInlayParameterNameHints = "all",
					includeInlayParameterNameHintsWhenArgumentMatchesName = false,
				},
			},
		},
	},
}
