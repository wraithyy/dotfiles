vim.g.mapleader = " "
vim.keymap.set(
	"n",
	"<leader>.",
	"<cmd>lua vim.lsp.buf.code_action()<CR>",
	{ desc = "Code Action", noremap = true, silent = true }
)
vim.keymap.set(
	"n",
	"<leader>,",
	"<cmd>lua vim.diagnostic.open_float()<CR>",
	{ desc = "Show Problems", noremap = true, silent = true }
)
vim.o.langmap = table.concat({
	"+1,ě2,š3,č4,ř5,ž6,ý7,á8,í9,é0,ú-,ů=", -- české znaky přemapované na čísla
	"2@,3#,4$,5~,6^,7&,=%,8*,9{,0}",
}, ",")

-- Zavře všechny buffery kromě aktuálního a snacks explorer/picker
vim.keymap.set("n", "<Leader>q", function()
	for _, buf in ipairs(vim.api.nvim_list_bufs()) do
		local filetype = vim.api.nvim_get_option_value("filetype", { buf = buf })
		if filetype ~= "snacks_picker_list" and filetype ~= "snacks_picker_input" and buf ~= vim.api.nvim_get_current_buf() then
			vim.api.nvim_buf_delete(buf, { force = true })
		end
	end
end, { noremap = true, silent = true, desc = "Close all other buffers" })
vim.keymap.set("n", "<space>", "<nop>")
vim.keymap.set("n", "ZZ", "<cmd>wqa<CR>", { desc = "Save all and quit" })

-- Drag line --
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv")
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv")
-- Move page down and center --
--vim.keymap.set("n", "<C-d>", "<C-d>zz")
-- Move page up and center --
--vim.keymap.set("n", "<C-u>", "<C-u>zz")
-- go to previous buffer --
vim.keymap.set("n", "<leader>bp", "<cmd>bprevious<CR>", { desc = "Previous buffer" })
vim.keymap.set("n", "<C-h>", "<cmd>bprevious<CR>", { desc = "Previous buffer" })
-- go to next buffer --
vim.keymap.set("n", "<leader>bn", "<cmd>bnext<CR>", { desc = "Next buffer" })
vim.keymap.set("n", "<C-l>", "<cmd>bnext<CR>", { desc = "Next buffer" })

vim.keymap.set("n", "<leader>bd", "<Cmd>BufferClose<CR>", { desc = "Close buffer (keep order)" })
vim.keymap.set("n", "<leader>bP", "<Cmd>BufferPin<CR>", { desc = "Pin buffer" })
-- delete without yank --
-- vim.keymap.set("n", "<leader>dd", '"_d', { desc = "Delete without yank" })
-- vim.keymap.set("n", "<leader>pp", '"_dP', { desc = "Paste without yank" })
--
-- movement to end and beginning of line --
vim.keymap.set("n", "H", "^")
vim.keymap.set("n", "L", "$")
vim.keymap.set("v", "H", "^")
vim.keymap.set("v", "L", "$")
--Terminal--
vim.keymap.set("t", "<esc>", [[<C-\><C-n>]])
vim.keymap.set("t", "jj", [[<C-\><C-n>]])
-- Window navigation from terminal
vim.keymap.set("t", "<C-h>", [[<Cmd>wincmd h<CR>]])
vim.keymap.set("t", "<C-j>", [[<Cmd>wincmd j<CR>]])
vim.keymap.set("t", "<C-k>", [[<Cmd>wincmd k<CR>]])
vim.keymap.set("t", "<C-l>", [[<Cmd>wincmd l<CR>]])
vim.keymap.set("n", "§", "`", { noremap = true, silent = true })
vim.keymap.set("n", "<leader>cpr", "<cmd>CopyRelativePath<cr>", { desc = "Copy relative path" })
vim.keymap.set("n", "<leader>cpa", "<cmd>CopyAbsolutePath<cr>", { desc = "Copy absolute path" })
local function copy_for_claude()
	local path = vim.fn.expand("%:.")
	local mode = vim.fn.mode()
	local ref
	if mode == "v" or mode == "V" or mode == "\22" then
		local start_line = vim.fn.line("v")
		local end_line = vim.fn.line(".")
		if start_line > end_line then
			start_line, end_line = end_line, start_line
		end
		ref = "@" .. path .. ":" .. start_line .. "-" .. end_line
	else
		ref = "@" .. path
	end
	vim.fn.setreg("+", ref)
	vim.notify("Copied: " .. ref)
end
vim.keymap.set({ "n", "v" }, "<leader>cpc", copy_for_claude, { desc = "Copy @path[:lines] (Claude Code)", noremap = true, silent = true })
