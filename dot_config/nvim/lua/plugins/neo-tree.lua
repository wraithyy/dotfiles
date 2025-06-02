require("which-key").add({
	{ "<leader>e", desc = "NeoTree", icon = "" },
	{ "<leader>ee", desc = "Open/focus Neotree", icon = { icon = "󱞊", color = "green" } },
	{ "<leader>et", desc = "Toggle Neotree", icon = "" },
	{ "<leader>eb", desc = "Open buffers", icon = "﬘" },
	{ "<leader>eg", desc = "Open git status", icon = "" },
})
return {
	{
		"nvim-neo-tree/neo-tree.nvim",
		lazy = false,
		branch = "v3.x",
		dependencies = {
			"nvim-lua/plenary.nvim",
			"echasnovski/mini.icons",
			"MunifTanjim/nui.nvim",
		},
		opts = function(_, opts)
			local function on_move(data)
				Snacks.rename.on_rename_file(data.source, data.destination)
			end
			local events = require("neo-tree.events")
			opts.event_handlers = opts.event_handlers or {}
			vim.list_extend(opts.event_handlers, {
				{ event = events.FILE_MOVED, handler = on_move },
				{ event = events.FILE_RENAMED, handler = on_move },
			})
		end,
		init = function()
			vim.api.nvim_create_autocmd("BufEnter", {
				group = vim.api.nvim_create_augroup("load_neo_tree", {}),
				desc = "Loads neo-tree when openning a directory",
				callback = function(args)
					local stats = vim.uv.fs_stat(args.file)

					if not stats or stats.type ~= "directory" then
						return
					end

					require("neo-tree")

					return true
				end,
			})
		end,
		config = function()
			local get_path = function(state)
				local node = state.tree:get_node()
				if node.type == "directory" then
					return node.path
				end
				return node:get_parent_id()
			end

			local do_setcd = function(state)
				local p = get_path(state)
				vim.cmd(string.format('exec(":lcd %s")', p))
				return p
			end
			local folder_decorations = require("config.folder-decorations")

			local folder_icons = folder_decorations.get_folder_icons()
			local highlights = folder_decorations.get_highlights()

			for group, colors in pairs(highlights) do
				vim.api.nvim_set_hl(0, group, colors)
			end

			require("neo-tree").setup({
				close_if_last_window = true,
				popup_border_style = "rounded",
				enable_git_status = true,
				enable_diagnostics = true,
				sources = { "filesystem", "buffers", "git_status" },
				source_selector = {
					winbar = true,
					content_layout = "center",
					sources = {
						{ source = "filesystem", display_name = "󰙅 Files" },
						{ source = "buffers", display_name = "󰈙 Buffers" },
						{ source = "git_status", display_name = "󰊢 Git" },
					},
				},
				commands = {
					spectre = function(state)
						local p = do_setcd(state)
						require("spectre").open({
							is_insert_mode = true,
							cwd = p,
							is_close = false,
						})
						vim.cmd("Neotree close")
					end,
				},
				filesystem = {
					hijack_netrw_behavior = "open_current",
					filtered_items = {
						visible = true,
						hide_dotfiles = false,
						hide_gitignored = false,
						hide_hidden = false,
					},
					follow_current_file = { enabled = true },
					use_libuv_file_watcher = true,
				},
				window = {
					position = "left",
					width = 50,
					mappings = {
						["<leader>r"] = "spectre",
					},
				},
				buffers = {
					follow_current_file = { enabled = true },
					window = {
						position = "left",
						mappings = {
							["<leader>r"] = "spectre",
						},
					},
				},
				git_status = {
					window = {
						position = "left",
						mappings = {
							["<leader>r"] = "spectre",
						},
					},
				},
				default_component_configs = {
					icon = {
						provider = function(icon, node, state)
							if node.type == "file" or node.type == "terminal" then
								local success, web_devicons = pcall(require, "nvim-web-devicons")
								local name = node.type == "terminal" and "terminal" or node.name
								if success then
									local devicon, hl = web_devicons.get_icon(name)
									icon.text = devicon or icon.text
									icon.highlight = hl or icon.highlight
								end
							end
							if node.type == "directory" then
								local decorated = folder_icons[node.name:lower()]
								if decorated then
									icon.text = decorated.text
									icon.highlight = decorated.hl
								end
							end
						end,
					},
				},
			})

			-- Klávesové zkratky pro rychlé otevření/uzavření neo-tree
			vim.keymap.set(
				"n",
				"<leader>et",
				":Neotree toggle<CR>",
				{ noremap = true, silent = true, desc = "Toggle files" }
			)
			vim.keymap.set(
				"n",
				"<leader>ee",
				":Neotree focus filesystem<CR>",
				{ noremap = true, silent = true, desc = "Focus filesystem" }
			)
			vim.keymap.set(
				"n",
				"<leader>eb",
				":Neotree focus buffers<CR>",
				{ noremap = true, silent = true, desc = "Focus buffers" }
			)
			vim.keymap.set(
				"n",
				"<leader>eg",
				":Neotree focus git_status<CR>",
				{ noremap = true, silent = true, desc = "Focus git status" }
			)
		end,
	},
}
