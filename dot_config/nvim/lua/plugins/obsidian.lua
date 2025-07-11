return {
	"obsidian-nvim/obsidian.nvim",
	version = "*",
	lazy = true,
	ft = "markdown",
	dependencies = {
		"nvim-lua/plenary.nvim",
	},
	opts = {
		workspaces = {
			{
				name = "Notes",
				path = "~/Notes",
			},
		},
		
		-- Blink.cmp completion
		completion = {
			nvim_cmp = false,
			blink = true,
			min_chars = 2,
		},
		
		-- Note creation
		new_notes_location = "1 - Inbox",
		note_id_func = function(title)
			local suffix = ""
			if title ~= nil then
				suffix = title:gsub(" ", "-"):gsub("[^A-Za-z0-9-]", ""):lower()
			else
				for _ = 1, 4 do
					suffix = suffix .. string.char(math.random(65, 90))
				end
			end
			return tostring(os.date("%Y-%m-%d")) .. "-" .. suffix
		end,
		
		-- Daily notes
		daily_notes = {
			folder = "4 - Daily",
			date_format = "%Y-%m-%d",
			alias_format = "%B %-d, %Y",
		},
		
		-- Templates
		templates = {
			subdir = "Templates",
			date_format = "%Y-%m-%d",
			time_format = "%H:%M",
		},
		
		-- Attachments
		attachments = {
			img_folder = "attachments",
		},
		
		-- Clean UI
		ui = {
			enable = false,
		},
		
		-- URL handling
		follow_url_func = function(url)
			vim.fn.jobstart({"open", url})
		end,
	},
	
	config = function(_, opts)
		require("obsidian").setup(opts)
		
		-- Keybindings
		local wk = require("which-key")
		wk.add({
			{ "<leader>o", group = "󰎚 Obsidian" },
			
			-- Core functions
			{ "<leader>on", "<cmd>ObsidianNew<cr>", desc = "New Note" },
			{ "<leader>oo", "<cmd>ObsidianOpen<cr>", desc = "Open in Obsidian" },
			{ "<leader>of", "<cmd>ObsidianFollowLink<cr>", desc = "Follow Link" },
			{ "<leader>ob", "<cmd>ObsidianBacklinks<cr>", desc = "Backlinks" },
			{ "<leader>os", "<cmd>ObsidianSearch<cr>", desc = "Search" },
			{ "<leader>oq", "<cmd>ObsidianQuickSwitch<cr>", desc = "Quick Switch" },
			
			-- Daily notes
			{ "<leader>od", "<cmd>ObsidianDailies<cr>", desc = "Daily Notes" },
			{ "<leader>ot", "<cmd>ObsidianToday<cr>", desc = "Today" },
			{ "<leader>oy", "<cmd>ObsidianYesterday<cr>", desc = "Yesterday" },
			
			-- Templates & Tags
			{ "<leader>oT", "<cmd>ObsidianTemplate<cr>", desc = "Template" },
			{ "<leader>og", "<cmd>ObsidianTags<cr>", desc = "Tags" },
			
			-- Links
			{ "<leader>ol", "<cmd>ObsidianLink<cr>", desc = "Link Selection", mode = "v" },
			{ "<leader>oL", "<cmd>ObsidianLinkNew<cr>", desc = "Link New", mode = "v" },
		})
		
		-- Auto-commands for better markdown in vault
		vim.api.nvim_create_autocmd("FileType", {
			pattern = "markdown",
			callback = function()
				local current_file = vim.fn.expand("%:p")
				if current_file:match(vim.fn.expand("~/Notes")) then
					vim.opt_local.conceallevel = 2
					vim.opt_local.concealcursor = "nc"
					vim.opt_local.wrap = true
					vim.opt_local.linebreak = true
					vim.opt_local.spell = true
					vim.opt_local.spelllang = "en_us"
					
					-- Custom gd for obsidian links
					vim.keymap.set("n", "gd", function()
						local success, _ = pcall(vim.cmd, "ObsidianFollowLink")
						if not success then
							vim.lsp.buf.definition()
						end
					end, { buffer = true, desc = "Follow Link/LSP Definition" })
				end
			end,
		})
	end,
}
