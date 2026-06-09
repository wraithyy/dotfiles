local capabilities = vim.lsp.protocol.make_client_capabilities()
do
	local ok, blink = pcall(require, "blink.cmp")
	if ok then
		capabilities = blink.get_lsp_capabilities(capabilities)
	end
end

vim.api.nvim_create_autocmd("LspAttach", {
	group = vim.api.nvim_create_augroup("my_lsp_attach", { clear = true }),
	callback = function(args)
		local client = vim.lsp.get_client_by_id(args.data.client_id)
		if not client then
			return
		end
		local bufnr = args.buf
		local map = function(mode, lhs, rhs, desc)
			vim.keymap.set(mode, lhs, rhs, { buffer = bufnr, desc = desc })
		end

		if client.server_capabilities.documentHighlightProvider then
			local grp = vim.api.nvim_create_augroup("lsp_doc_hl_" .. bufnr, { clear = true })
			vim.api.nvim_create_autocmd("CursorHold", {
				group = grp,
				buffer = bufnr,
				callback = vim.lsp.buf.document_highlight,
			})
			vim.api.nvim_create_autocmd("CursorMoved", {
				group = grp,
				buffer = bufnr,
				callback = vim.lsp.buf.clear_references,
			})
		end

		map("n", "K", vim.lsp.buf.hover, "Hover Documentation")
		map("n", "gD", vim.lsp.buf.declaration, "Go to Declaration")
		map("n", "<F2>", vim.lsp.buf.rename, "Rename Symbol")
		map("n", "<F4>", vim.lsp.buf.code_action, "Code Actions")
		map("n", "<leader>k", vim.lsp.buf.signature_help, "Signature Help")
		if client:supports_method("textDocument/inlayHint") then
			map("n", "<leader>ih", function()
				vim.lsp.inlay_hint.enable(not vim.lsp.inlay_hint.is_enabled({ bufnr = bufnr }), { bufnr = bufnr })
			end, "Toggle Inlay Hints")
		end
		map({ "n", "x" }, "<F3>", function()
			vim.lsp.buf.format({ async = true })
		end, "Format Document")
	end,
})

vim.lsp.config("*", { capabilities = capabilities })

-- Eslint root_markers gate: only starts in projects that have an eslint config
vim.lsp.config("eslint", {
	root_markers = {
		".eslintrc",
		".eslintrc.js",
		".eslintrc.cjs",
		".eslintrc.json",
		".eslintrc.yaml",
		".eslintrc.yml",
		"eslint.config.js",
		"eslint.config.mjs",
		"eslint.config.cjs",
	},
})

-- vtsls (nahrazuje typescript-tools.nvim) — TS/JS LSP přes native config
vim.lsp.config("vtsls", {
	settings = {
		typescript = {
			inlayHints = {
				parameterNames = { enabled = "all", suppressWhenArgumentMatchesName = true },
				variableTypes = { enabled = true },
				propertyDeclarationTypes = { enabled = true },
				functionLikeReturnTypes = { enabled = true },
				parameterTypes = { enabled = true },
				enumMemberValues = { enabled = true },
			},
		},
		javascript = {
			inlayHints = {
				parameterNames = { enabled = "all", suppressWhenArgumentMatchesName = true },
				variableTypes = { enabled = true },
				propertyDeclarationTypes = { enabled = true },
				functionLikeReturnTypes = { enabled = true },
				parameterTypes = { enabled = true },
				enumMemberValues = { enabled = true },
			},
		},
	},
})

vim.lsp.enable({ "rust_analyzer", "biome", "marksman", "astro", "eslint", "vtsls" })

return {
	{
		-- Dodává definice serverů (lsp/<name>.lua) pro native vim.lsp.enable, vč. vtsls
		"neovim/nvim-lspconfig",
		event = { "BufReadPre", "BufNewFile" },
	},
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
			ensure_installed = { "eslint", "rust_analyzer", "biome", "marksman", "vtsls" },
			automatic_enable = false,
		},
	},
}
