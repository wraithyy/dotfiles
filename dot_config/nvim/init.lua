_G.dd = function(...)
	Snacks.debug.inspect(...)
end
_G.bt = function()
	Snacks.debug.backtrace()
end
vim.print = _G.dd

require("config.lazy")
require("config.highlight_on_yank")
require("config.autoroot")
require("config.remap")
require("config.diagnostics-design")
require("config.title")
require("config.auto-save")
require("config.autoread")
require("config.claude")
vim.opt.relativenumber = true
vim.o.winborder = "rounded"

vim.opt.termguicolors = true
vim.opt.number = true
vim.opt.cursorline = true
vim.opt.clipboard = "unnamedplus,unnamed"
vim.opt.wrap = false
vim.o.mousescroll = "ver:3,hor:6"
vim.opt.ignorecase = true
vim.api.nvim_create_user_command("CopyAbsolutePath", function()
    local path = vim.fn.expand("%:p")
    vim.fn.setreg("+", path)
    vim.notify('Copied "' .. path .. '" to the clipboard!')
end, {})
vim.api.nvim_create_user_command("CopyRelativePath", function()
  local path = vim.fn.expand("%")
  vim.fn.setreg("+", path)
  print("Copied: " .. path)
end, {})
vim.opt.guicursor = {
	"n-v-c:block", -- Normal, visual, command-line: block cursor
	"i-ci-ve:ver25", -- Insert, command-line insert, visual-exclude: vertical bar cursor with 25% width
	"r-cr:hor20", -- Replace, command-line replace: horizontal bar cursor with 20% height
	"o:hor50", -- Operator-pending: horizontal bar cursor with 50% height
	"a:blinkwait700-blinkoff400-blinkon250", -- All modes: blinking settings
	"sm:block-blinkwait175-blinkoff150-blinkon175", -- Showmatch: block cursor with specific blinking settings
}
