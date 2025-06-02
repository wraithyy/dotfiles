require("which-key").add({ { "<leader>d", desc = "Diffview", icon = "" } })
return {
	"sindrets/diffview.nvim",
	cmd = "DiffviewOpen",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"echasnovski/mini.icons",
	},
	opts = { view = { default = { layout = "diff2_horizontal" } } },
	keys = {
		{ "<leader>dd", "<cmd>DiffviewOpen<CR>", desc = "Open Diffview" },
		{ "<leader>df", "<cmd>DiffviewFileHistory --follow %<CR>", desc = "File History" },
		{ "<leader>dl", "<Esc><Cmd>'<,'>DiffviewFileHistory --follow<CR>", desc = "Range history", mode = { "v" } },
		{ "<leader>dq", "<cmd>DiffviewClose<CR>", desc = "Close Diffview" },
		{ "<leader>dr", "<cmd>DiffviewFileHistory<CR>", desc = "RepoHistory" },
	},
}
