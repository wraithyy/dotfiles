local wk = require("which-key")
wk.add({
	{ "<leader>o", group = "󰎚 Obsidian" },
	{ "<leader>on", "<cmd>ObsidianNew<CR>", desc = "󱞁 New Note" },
	{ "<leader>oq", "<cmd>ObsidianQuickSwitch<CR>", desc = "󰈙 Quick open note" },
	{ "<leader>os", "<cmd>ObsidianSearch<CR>", desc = "󰍉 Obsidian search" },
})

return {

	"epwalsh/obsidian.nvim",
	version = "*", -- recommended, use latest release instead of latest commit
	event = {
		"BufReadPre " .. vim.fn.expand("~") .. "Notes/**/*.md",
		"BufNewFile " .. vim.fn.expand("~") .. "Notes/**/*.md",
	},
	cmd = { "ObsidianOpen", "ObsidianQuickSwitch", "ObsidianNew" },
	dependencies = {
		-- Required.
		"nvim-lua/plenary.nvim",

		-- see below for full list of optional dependencies 👇
	},
	opts = {

		dir = "~/Notes",
		notes_subdir = "1 - Inbox",
		new_notes_location = "notes_subdir",
		ui = { enable = false },
		completion = {
			nvim_cmp = true,
		},
		picker = {
			-- Set your preferred picker. Can be one of 'telescope.nvim', 'fzf-lua', or 'mini.pick'.
			-- name = "telescope.nvim",
			-- Optional, configure key mappings for the picker. These are the defaults.
			-- Not all pickers support all mappings.
			note_mappings = {
				-- Create a new note from your query.
				new = "<C-x>",
				-- Insert a link to the selected note.
				insert_link = "<C-l>",
			},
			tag_mappings = {
				-- Add tag(s) to current note.
				tag_note = "<C-x>",
				-- Insert a tag at the current location.
				insert_tag = "<C-l>",
			},
		},
		note_id_func = function(title)
			-- Create note IDs in a Zettelkasten format with a timestamp and a suffix.
			-- In this case a note with the title 'My new note' will be given an ID that looks
			-- like '1657296016-my-new-note', and therefore the file name '1657296016-my-new-note.md'
			local suffix = ""
			if title ~= nil then
				-- If title is given, transform it into valid file name.
				suffix = title:gsub(" ", "-"):gsub("[^A-Za-z0-9-]", ""):lower()
			else
				-- If title is nil, just add 4 random uppercase letters to the suffix.
				for _ = 1, 4 do
					suffix = suffix .. string.char(math.random(65, 90))
				end
			end
			return tostring(os.date("%Y-%m-%d")) .. "-" .. suffix
		end,
	},
	config = function(_, opts)
		package.loaded["nvim-cmp"] = package.loaded["blink.compat"]
		require("obsidian").setup(opts)
		local cmp = require("cmp")
		cmp.register_source("obsidian", require("cmp_obsidian").new())
		cmp.register_source("obsidian_new", require("cmp_obsidian_new").new())
		cmp.register_source("obsidian_tags", require("cmp_obsidian_tags").new())

		-- WhichKey mapování
	end,
}
