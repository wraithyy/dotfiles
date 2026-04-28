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

		if client.name == "typescript-tools" then
			local ok, twoslash = pcall(require, "twoslash-queries")
			if ok then
				twoslash.attach(client, bufnr)
			end
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

vim.lsp.enable({ "rust_analyzer", "biome", "marksman", "astro", "eslint" })

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
			ensure_installed = { "eslint", "rust_analyzer", "biome", "marksman" },
			automatic_enable = false,
		},
	},
	{
		"pmizio/typescript-tools.nvim",
		event = { "BufReadPre", "BufNewFile" },
		dependencies = { "nvim-lua/plenary.nvim" },
		opts = {
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
