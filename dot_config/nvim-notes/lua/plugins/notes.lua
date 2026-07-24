return {
	{
		"catppuccin/nvim",
		name = "catppuccin",
		priority = 1000,
		config = function()
			require("catppuccin").setup({ flavour = "mocha" })
			vim.cmd.colorscheme("catppuccin")
		end,
	},

	{
		"folke/snacks.nvim",
		priority = 900,
		lazy = false,
		opts = function()
			-- date-prefixed capture files only (skip inbox/README.md)
			local inbox_count = #vim.fn.glob("inbox/[0-9]*.md", false, true)
			return {
			picker = { enabled = true },
			explorer = { enabled = true },
			dashboard = {
				preset = {
					header = table.concat({
						"  _   _       _            ",
						" | \\ | | ___ | |_ ___  ___ ",
						" |  \\| |/ _ \\| __/ _ \\/ __|",
						" | |\\  | (_) | ||  __/\\__ \\",
						" |_| \\_|\\___/ \\__\\___||___/",
					}, "\n"),
					keys = {
						{ icon = " ", key = "f", desc = "Find note", action = ":lua Snacks.dashboard.pick('files')" },
						{ icon = " ", key = "g", desc = "Grep vault", action = ":lua Snacks.dashboard.pick('live_grep')" },
						{ icon = " ", key = "i", desc = ("Inbox (%d)"):format(inbox_count), action = ":lua Snacks.picker.files({ dirs = { 'inbox' } })" },
						{ icon = " ", key = "r", desc = "Recent", action = ":lua Snacks.dashboard.pick('oldfiles', { filter = { cwd = true } })" },
						{ icon = " ", key = "n", desc = "New inbox note", action = function() vim.schedule(function() vim.api.nvim_input("<space>nn") end) end },
						{ icon = " ", key = "q", desc = "Quit", action = ":qa" },
					},
				},
				sections = {
					{ section = "header" },
					{ section = "keys", gap = 1, padding = 1 },
					{ section = "recent_files", cwd = true, limit = 8, title = "Recent", padding = 1 },
				},
			},
			}
		end,
		keys = {
			{ "<leader>ff", function() Snacks.picker.files() end, desc = "Find note" },
			{ "<leader>fg", function() Snacks.picker.grep() end, desc = "Grep vault" },
			{ "<leader>fr", function() Snacks.picker.recent({ filter = { cwd = true } }) end, desc = "Recent notes" },
			{ "<leader>fb", function() Snacks.picker.buffers() end, desc = "Buffers" },
			{ "<leader>e", function() Snacks.explorer() end, desc = "Explorer" },
		},
	},

	{
		"MeanderingProgrammer/render-markdown.nvim",
		ft = "markdown",
		opts = {},
	},

	{
		"lewis6991/gitsigns.nvim",
		event = { "BufReadPre", "BufNewFile" },
		opts = {},
	},

	{
		"saghen/blink.cmp",
		version = "1.*",
		event = "InsertEnter",
		opts = {
			-- lua fuzzy: no prebuilt-binary download; plenty fast for buffer/path
			fuzzy = { implementation = "lua" },
			sources = { default = { "path", "buffer" } },
			completion = { documentation = { auto_show = false } },
		},
	},

	{
		"zbirenbaum/copilot.lua",
		cmd = "Copilot",
		build = ":Copilot auth",
		event = "InsertEnter",
		opts = {
			suggestion = {
				enabled = true,
				auto_trigger = true,
				keymap = {
					accept = "<Tab>",
					next = "<M-]>",
					prev = "<M-[>",
					dismiss = "<C-]>",
				},
			},
			panel = { enabled = false },
			filetypes = { markdown = true, yaml = true },
		},
	},
}
