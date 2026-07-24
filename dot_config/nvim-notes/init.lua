-- Lightweight nvim config for the Notes vault (~/Development/Notes).
-- Launched via NVIM_APPNAME=nvim-notes (own plugin/data dirs, main config untouched).

vim.g.mapleader = " "
vim.g.maplocalleader = "\\"
vim.keymap.set("n", "<space>", "<nop>")

-- Options
vim.opt.termguicolors = true
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.cursorline = true
vim.opt.clipboard = "unnamedplus,unnamed"
vim.opt.ignorecase = true
vim.opt.smartcase = true
vim.o.winborder = "rounded"
vim.o.mousescroll = "ver:3,hor:0"
-- prose, not code
vim.opt.wrap = true
vim.opt.linebreak = true
vim.opt.conceallevel = 2
vim.opt.spelllang = { "cs", "en" }
-- gf follows relative md links without extension
vim.opt.suffixesadd:append(".md")

-- Czech keyboard: numbers row (same as main config)
vim.o.langmap = table.concat({
	"+1,ě2,š3,č4,ř5,ž6,ý7,á8,í9,é0,ú-,ů=",
	"2@,3#,4$,5~,6^,7&,=%,8*,9{,0}",
}, ",")

-- Keymaps (subset of main remap.lua worth keeping for prose)
vim.keymap.set("n", "H", "^")
vim.keymap.set("n", "L", "$")
vim.keymap.set("v", "H", "^")
vim.keymap.set("v", "L", "$")
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv")
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv")
vim.keymap.set("n", "ZZ", "<cmd>wqa<CR>", { desc = "Save all and quit" })
vim.keymap.set("n", "<C-h>", "<cmd>bprevious<CR>", { desc = "Previous buffer" })
vim.keymap.set("n", "<C-l>", "<cmd>bnext<CR>", { desc = "Next buffer" })
vim.keymap.set("n", "<leader>us", function()
	vim.wo.spell = not vim.wo.spell
	vim.notify("Spell: " .. (vim.wo.spell and "ON" or "OFF"))
end, { desc = "Toggle spell" })

-- Quick capture: new inbox note YYYY-MM-DD-HHmm-slug.md
vim.keymap.set("n", "<leader>nn", function()
	vim.ui.input({ prompt = "Inbox note slug: " }, function(slug)
		if not slug or slug == "" then
			return
		end
		slug = slug:lower():gsub("%s+", "-"):gsub("[^%w%-]", "")
		local path = ("%s/inbox/%s-%s.md"):format(vim.fn.getcwd(), os.date("%Y-%m-%d-%H%M"), slug)
		vim.cmd.edit(path)
	end)
end, { desc = "New inbox note" })

-- Autoread (same as main config: tmux focus-events -> checktime)
vim.o.autoread = true
local ar = vim.api.nvim_create_augroup("auto_read", { clear = true })
vim.api.nvim_create_autocmd({ "FocusGained", "BufEnter", "CursorHold" }, {
	group = ar,
	callback = function()
		if vim.fn.mode() ~= "c" then
			vim.cmd("silent! checktime")
		end
	end,
})
vim.api.nvim_create_autocmd("FileChangedShellPost", {
	group = ar,
	callback = function()
		vim.notify("File changed on disk, reloaded", vim.log.levels.WARN)
	end,
})

-- Auto-save: debounced write on InsertLeave/FocusLost (autosync commits later)
local timer = vim.uv.new_timer()
vim.api.nvim_create_autocmd({ "InsertLeave", "FocusLost" }, {
	group = vim.api.nvim_create_augroup("auto_save", { clear = true }),
	callback = function(args)
		timer:stop()
		timer:start(250, 0, vim.schedule_wrap(function()
			local buf = args.buf
			if vim.api.nvim_buf_is_valid(buf) and vim.bo[buf].buftype == "" and vim.bo[buf].modified then
				vim.api.nvim_buf_call(buf, function()
					vim.cmd("silent! update")
				end)
			end
		end))
	end,
})

-- Terminal title
vim.opt.title = true
vim.opt.titlestring = "Notes"

-- Treesitter highlight via bundled parsers (markdown, markdown_inline) —
-- no nvim-treesitter plugin needed for a md-only config
vim.api.nvim_create_autocmd("FileType", {
	pattern = "markdown",
	callback = function()
		vim.treesitter.start()
	end,
})

-- Highlight on yank
vim.api.nvim_create_autocmd("TextYankPost", {
	callback = function()
		vim.highlight.on_yank()
	end,
})

-- Claude Code tmux integration (send prompt/reference to sibling pane)
require("claude")

-- Bootstrap lazy.nvim (own data dir via NVIM_APPNAME)
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.uv.fs_stat(lazypath) then
	vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable",
		"https://github.com/folke/lazy.nvim.git", lazypath })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
	spec = { { import = "plugins" } },
	install = { colorscheme = { "catppuccin" } },
	checker = { enabled = false },
})
