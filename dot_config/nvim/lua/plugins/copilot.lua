return {
	{
		"zbirenbaum/copilot.lua",
		cmd = "Copilot",
		build = ":Copilot auth",
		event = "InsertEnter",
		config = function()
			require("copilot").setup({
				suggestion = {
					enabled = true,
					auto_trigger = true,
					keymap = {
						accept = "<Tab>",
						accept_word = false,
						accept_line = false,
						next = "<M-]>",
						prev = "<M-[>",
						dismiss = "<C-]>",
					},
				},
				panel = { enabled = false },
				filetypes = {
					markdown = true,
					help = true,
				},
			})
		end,
	},
	{
		"CopilotC-Nvim/CopilotChat.nvim",
		branch = "main",
		dependencies = {
			{ "zbirenbaum/copilot.lua" },
			{ "nvim-lua/plenary.nvim" },
		},
		build = "make tiktoken",
		opts = function()
			local user = vim.env.USER or "User"
			user = user:sub(1, 1):upper() .. user:sub(2)
			return {
				auto_insert_mode = true,
				question_header = "  " .. user .. " ",
				answer_header = "  Copilot ",
				window = {
					width = 0.4,
				},
				-- Add context selection configuration
				selection = function(source)
					local select = require("CopilotChat.select")
					return select.visual(source) or select.buffer(source)
				end,
				-- Enable snacks.picker for prompts and models
				prompts = {
					picker = "snacks",
				},
				-- Add modern mappings
				mappings = {
					submit_prompt = {
						normal = "<CR>",
						insert = "<CR>",
					},
					accept_diff = {
						normal = "<C-y>",
						insert = "<C-y>",
					},
					yank_diff = {
						normal = "gy",
						register = '"',
					},
					show_diff = {
						normal = "gd",
					},
					show_system_prompt = {
						normal = "gp",
					},
					show_user_selection = {
						normal = "gs",
					},
				},
			}
		end,
		config = function(_, opts)
			local chat = require("CopilotChat")
			chat.setup(opts)

			-- Setup keymaps with which-key
			local wk = require("which-key")
			wk.add({
				{ "<leader>a", group = "AI", icon = "🤖" },
				{
					"<leader>aa",
					function()
						require("CopilotChat").toggle()
					end,
					desc = "Toggle CopilotChat",
					icon = "💬",
				},
				{
					"<leader>ax",
					function()
						require("CopilotChat").reset()
					end,
					desc = "Reset CopilotChat",
					icon = "🔄",
				},
				{
					"<leader>aq",
					function()
						local input = vim.fn.input("Quick Chat: ")
						if input ~= "" then
							require("CopilotChat").ask(input)
						end
					end,
					desc = "Quick Chat",
					icon = "⚡",
				},
				{
					"<leader>ap",
					function()
						-- Use CopilotChatPrompts command with snacks.picker
						vim.cmd("CopilotChatPrompts")
					end,
					desc = "Prompt Actions",
					icon = "📝",
				},
				-- { "<leader>at", function()
				-- 	local providers = {
				-- 		{
				-- 			name = "🤖 Copilot",
				-- 			action = function()
				-- 				local copilot_ok, copilot = pcall(require, "copilot.command")
				-- 				if copilot_ok then
				-- 					copilot.enable()
				-- 				end
				-- 				local codeium_ok, codeium = pcall(require, "codeium.virtual_text")
				-- 				if codeium_ok and codeium.set_enabled then
				-- 					codeium.set_enabled(false)
				-- 				end
				-- 				vim.notify("Switched to Copilot", vim.log.levels.INFO)
				-- 			end,
				-- 		},
				-- 		{
				-- 			name = "🔮 Codeium",
				-- 			action = function()
				-- 				local suggestion_ok, suggestion = pcall(require, "copilot.suggestion")
				-- 				if suggestion_ok and suggestion.dismiss then
				-- 					suggestion.dismiss()
				-- 				end
				-- 				local copilot_ok, copilot = pcall(require, "copilot.command")
				-- 				if copilot_ok and copilot.disable then
				-- 					copilot.disable()
				-- 				end
				-- 				local codeium_ok, codeium = pcall(require, "codeium.virtual_text")
				-- 				if codeium_ok and codeium.set_enabled then
				-- 					codeium.set_enabled(true)
				-- 				end
				-- 				vim.notify("Switched to Codeium", vim.log.levels.INFO)
				-- 			end,
				-- 		},
				-- 	}
				--
				-- 	vim.ui.select(providers, {
				-- 		prompt = "Select AI Provider:",
				-- 		format_item = function(item) return item.name end,
				-- 	}, function(choice)
				-- 		if choice then
				-- 			choice.action()
				-- 		end
				-- 	end)
				-- end, desc = "Select AI Provider", icon = "🔄" },
				-- -- Add model selector
				{
					"<leader>am",
					function()
						vim.cmd("CopilotChatModels")
					end,
					desc = "Select AI Model",
					icon = "🎯",
				},
			})
		end,
	},
}
