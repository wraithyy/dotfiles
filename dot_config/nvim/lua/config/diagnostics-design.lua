vim.diagnostic.config({
	signs = {
		text = {
			[vim.diagnostic.severity.ERROR] = "",
			[vim.diagnostic.severity.WARN] = "",
			[vim.diagnostic.severity.INFO] = "",
			[vim.diagnostic.severity.HINT] = "",
		},
		linehl = {
			[vim.diagnostic.severity.ERROR] = "DiagnosticErrorLine",
			[vim.diagnostic.severity.WARN] = "DiagnosticWarnLine",
			[vim.diagnostic.severity.INFO] = "DiagnosticInfoLine",
			[vim.diagnostic.severity.HINT] = "DiagnosticHintLine",
		},
	},

	severity_sort = true,
	virtual_text = true,
})
