return {
	{
		"folke/snacks.nvim",
		priority = 1000,
		lazy = false,
		---@type snacks.Config
		opts = {
			-- TODO: statuscolumn, dim,
			statuscolumn = { enabled = true, left = { "sign", "mark" } },
			bigfile = { enabled = true },
			words = { enabled = true },
			image = {},
			lazygit = {},
			git = {},
			toggle = {},
			scroll = { enabled = true },
			indent = { enabled = true },
			input = { enabled = true },
			notifier = { enabled = true },
			scope = { enabled = true },
			quickfile = { enabled = true },
			explorer = {
				enabled = true,
				replace_netrw = true,
				auto_close = true,
				follow_file = true,
				layout = {
					layout = {
						position = "left",
						width = 70,
					},
				},
				win = {
					list = {
						wo = {
							signcolumn = "yes:2",
						},
						keys = {
							["<leader>r"] = "spectre_search",
						},
					},
				},
			},
			picker = {
				layout = { preset = "telescope" },
				icons = {
					tree = {
						vertical = "│    ",
						middle   = "├──  ",
						last     = "└──  ",
					},
				},
				formatters = {
					file = {
						filename_first = true,
					},
				},
				actions = {
					spectre_search = function(picker)
						local item = picker:current()
						if not item or not item.file then return end
						local path = vim.fn.isdirectory(item.file) == 1
							and item.file
							or vim.fn.fnamemodify(item.file, ":h")
						vim.cmd("lcd " .. vim.fn.fnameescape(path))
						picker:close()
						require("spectre").open()
					end,
				},
			},
			dashboard = {
				-- enabled = true,
				-- preset = "advanced",
				preset = {
					header = [[
 █     █░ ██▀███   ▄▄▄       ██▓▄▄▄█████▓ ██░ ██▓██   ██▓
▓█░ █ ░█░▓██ ▒ ██▒▒████▄    ▓██▒▓  ██▒ ▓▒▓██░ ██▒▒██  ██▒
▒█░ █ ░█ ▓██ ░▄█ ▒▒██  ▀█▄  ▒██▒▒ ▓██░ ▒░▒██▀▀██░ ▒██ ██░
░█░ █ ░█ ▒██▀▀█▄  ░██▄▄▄▄██ ░██░░ ▓██▓ ░ ░▓█ ░██  ░ ▐██▓░
░░██▒██▓ ░██▓ ▒██▒ ▓█   ▓██▒░██░  ▒██▒ ░ ░▓█▒░██▓ ░ ██▒▓░
░ ▓░▒ ▒  ░ ▒▓ ░▒▓░ ▒▒   ▓▒█░░▓    ▒ ░░    ▒ ░░▒░▒  ██▒▒▒
  ▒ ░ ░    ░▒ ░ ▒░  ▒   ▒▒ ░ ▒ ░    ░     ▒ ░▒░ ░▓██ ░▒░
  ░   ░    ░░   ░   ░   ▒    ▒ ░  ░       ░  ░░ ░▒ ▒ ░░
    ░       ░           ░  ░ ░            ░  ░  ░░ ░
                                                 ░ ░
					]],
					keys = {
						{
							icon = " ",
							key = "f",
							desc = "Find File",
							action = function() Snacks.dashboard.pick('files') end,
						},
						{ icon = " ", key = "n", desc = "New File", action = function() vim.cmd('ene | startinsert') end },
						{
							icon = " ",
							key = "g",
							desc = "Find Text",
							action = function() Snacks.dashboard.pick('live_grep') end,
						},
						{
							icon = " ",
							key = "r",
							desc = "Recent Files",
							action = function() Snacks.dashboard.pick('oldfiles') end,
						},
						{
							icon = " ",
							key = "c",
							desc = "Config",
							action = function() Snacks.dashboard.pick('files', {cwd = os.getenv("HOME") .. "/.local/share/chezmoi/"}) end,
						},
						{
							icon = "󰎚 ",
							key = "o",
							desc = "Obsidian Notes",
							action = function() Snacks.dashboard.pick("files", {cwd = os.getenv("HOME") .. "/Notes/", filter = "*.md"}) end,
						},						{ icon = " ", key = "s", desc = "Restore Session", section = "session" },
						{
							icon = "󰒲 ",
							key = "L",
							desc = "Lazy",
							action = function() vim.cmd('Lazy') end,
							enabled = package.loaded.lazy ~= nil,
						},
						{ icon = " ", key = "q", desc = "Quit", action = function() vim.cmd('qa') end },
					},
				},
				sections = {
					{ section = "header" },
					{ icon = " ", title = "Keymaps", section = "keys", indent = 2, padding = 1 },
					{ icon = " ", title = "Recent Files", section = "recent_files", indent = 2, padding = 1 },
					{ icon = " ", title = "Projects", section = "projects", indent = 2, padding = 1 },
					{
						icon = "",
						title = "Git Status",
						section = "terminal",
						enabled = function()
							return Snacks.git.get_root() ~= nil
						end,
						cmd = "git status --short --branch --renames",
						height = 5,
						padding = 1,
						ttl = 5 * 60,
						indent = 3,
					},
					{ section = "startup" },
				},
			},
		},
		keys = {
			-- find
			{
				"<leader><leader>",
				function()
					Snacks.picker.buffers({ layout = { preset = "select" } })
				end,
				desc = "Buffers",
			},
			{
				"<leader>fc",
				function()
					Snacks.picker.files({ cwd = os.getenv("HOME") .. "/.local/share/chezmoi/" })
				end,
				desc = "Find Config File",
			},
			{
				"<leader>fF",
				function()
					Snacks.picker.files()
				end,
				desc = "Find Files",
			},
			{
				"<leader>ff",
				function()
					Snacks.picker.smart({ layout = { preset = "select" } })
				end,
				desc = "Find Files",
			},
			{
				"<leader>fg",
				function()
					Snacks.picker.grep()
				end,
				desc = "Find Git Files",
			},
			{
				"<leader>?",
				function()
					Snacks.picker.recent()
				end,
				desc = "Recent",
			},
			-- git
			{
				"<leader>gl",
				function()
					Snacks.picker.git_log()
				end,
				desc = "Git Log",
			},
			{
				"<leader>gx",
				function()
					Snacks.picker.git_status()
				end,
				desc = "Git Status",
			},
			-- Grep
			-- search
			{
				'<leader>s"',
				function()
					Snacks.picker.registers()
				end,
				desc = "Registers",
			},
			{
				"<leader>sa",
				function()
					Snacks.picker.autocmds()
				end,
				desc = "Autocmds",
			},
			{
				"<leader>sc",
				function()
					Snacks.picker.command_history()
				end,
				desc = "Command History",
			},
			{
				"<leader>sC",
				function()
					Snacks.picker.commands()
				end,
				desc = "Commands",
			},
			{
				"<leader>sd",
				function()
					Snacks.picker.diagnostics()
				end,
				desc = "Diagnostics",
			},
			{
				"<leader>sh",
				function()
					Snacks.picker.help()
				end,
				desc = "Help Pages",
			},
			{
				"<leader>sH",
				function()
					Snacks.picker.highlights()
				end,
				desc = "Highlights",
			},
			{
				"<leader>sj",
				function()
					Snacks.picker.jumps()
				end,
				desc = "Jumps",
			},
			{
				"<leader>sk",
				function()
					Snacks.picker.keymaps()
				end,
				desc = "Keymaps",
			},
			{
				"<leader>sl",
				function()
					Snacks.picker.loclist()
				end,
				desc = "Location List",
			},
			{
				"<leader>sM",
				function()
					Snacks.picker.man()
				end,
				desc = "Man Pages",
			},
			{
				"<leader>sm",
				function()
					Snacks.picker.marks()
				end,
				desc = "Marks",
			},
			{
				"<leader>sR",
				function()
					Snacks.picker.resume()
				end,
				desc = "Resume",
			},
			{
				"<leader>fp",
				function()
					Snacks.picker.projects()
				end,
				desc = "Projects",
			},
			{
				"<leader>sn",
				function()
					Snacks.picker.notifications()
				end,
				desc = "Notifications",
			},
			-- LSP
			{
				"gd",
				function()
					Snacks.picker.lsp_definitions()
				end,
				desc = "Goto Definition",
			},
			{
				"gr",
				function()
					Snacks.picker.lsp_references()
				end,
				nowait = true,
				desc = "References",
			},
			{
				"gI",
				function()
					Snacks.picker.lsp_implementations()
				end,
				desc = "Goto Implementation",
			},
			{
				"gy",
				function()
					Snacks.picker.lsp_type_definitions()
				end,
				desc = "Goto T[y]pe Definition",
			},
			{
				"<leader>lg",
				function()
					Snacks.lazygit.open()
				end,
				desc = "LazyGit",
			},
			{
				"<leader>lf",
				function()
					Snacks.lazygit.log_file()
				end,
				desc = "LazyGit file",
			},

			{
				"<leader>ll",
				function()
					Snacks.lazygit.log()
				end,
				desc = "LazyGit Log",
			},
			{
				"<leader>gh",
				function()
					Snacks.lazygit.log_file()
				end,
				desc = "File History",
			},
			{
				"<leader>ee",
				function()
					for _, win in ipairs(vim.api.nvim_tabpage_list_wins(0)) do
						local buf = vim.api.nvim_win_get_buf(win)
						if vim.bo[buf].filetype == "snacks_picker_list" then
							vim.api.nvim_set_current_win(win)
							return
						end
					end
					Snacks.explorer()
				end,
				desc = "Explorer",
			},
			{
				"<leader>et",
				function() Snacks.explorer() end,
				desc = "Toggle Explorer",
			},
			{
				"<leader>eb",
				function() Snacks.picker.buffers() end,
				desc = "Buffers",
			},
			{
				"<leader>eg",
				function() Snacks.picker.git_status() end,
				desc = "Git Status",
			},
		},
	},
	{
		"folke/trouble.nvim",
		optional = true,
		specs = {
			"folke/snacks.nvim",
			opts = function(_, opts)
				return vim.tbl_deep_extend("force", opts or {}, {
					picker = {
						actions = require("trouble.sources.snacks").actions,
						win = {
							input = {
								keys = {
									["<c-t>"] = {
										"trouble_open",
										mode = { "n", "i" },
									},
								},
							},
						},
					},
				})
			end,
		},
	},
}
