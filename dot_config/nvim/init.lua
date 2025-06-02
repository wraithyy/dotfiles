_G.dd = function(...)
	Snacks.debug.inspect(...)
end
_G.bt = function()
	Snacks.debug.backtrace()
end
vim.print = _G.dd
print("Ahoj Wraithy")

require("config.lazy")
require("config.highlight_on_yank")
require("config.autoroot")
require("config.remap")
require("config.diagnostics-design")
vim.opt.relativenumber = true

vim.opt.termguicolors = true
vim.opt.number = true
vim.opt.cursorline = true
vim.opt.clipboard = "unnamedplus,unnamed"
vim.opt.wrap = false
vim.o.mousescroll = "ver:3,hor:0"
vim.opt.ignorecase = true
--- lsp do notifier
vim.api.nvim_create_autocmd("LspProgress", {
	---@param ev {data: {client_id: integer, params: lsp.ProgressParams}}
	callback = function(ev)
		local spinner = { "⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏" }
		vim.notify(vim.lsp.status(), "info", {
			id = "lsp_progress",
			title = "LSP Progress",
			opts = function(notif)
				notif.icon = ev.data.params.value.kind == "end" and " "
					or spinner[math.floor(vim.uv.hrtime() / (1e6 * 80)) % #spinner + 1]
			end,
		})
	end,
})
-- vim.api.nvim_create_autocmd("VimEnter", {
-- 	callback = function()
-- 		require("snacks").dashboard()
-- 	end,
-- })

vim.opt.guicursor = {
	"n-v-c:block", -- Normal, visual, command-line: block cursor
	"i-ci-ve:ver25", -- Insert, command-line insert, visual-exclude: vertical bar cursor with 25% width
	"r-cr:hor20", -- Replace, command-line replace: horizontal bar cursor with 20% height
	"o:hor50", -- Operator-pending: horizontal bar cursor with 50% height
	"a:blinkwait700-blinkoff400-blinkon250", -- All modes: blinking settings
	"sm:block-blinkwait175-blinkoff150-blinkon175", -- Showmatch: block cursor with specific blinking settings
}
vim.api.nvim_set_hl(0, "DiagnosticErrorLine", { bg = "#3c1f1e" })
vim.api.nvim_set_hl(0, "DiagnosticWarnLine",  { bg = "#3c2e1e" })
vim.api.nvim_set_hl(0, "DiagnosticInfoLine",  { bg = "#1e2e3c" })
vim.api.nvim_set_hl(0, "DiagnosticHintLine",  { bg = "#1e3c2e" })
