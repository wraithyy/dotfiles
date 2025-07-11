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
				prompts = {
					Explain = {
						prompt = "/COPILOT_EXPLAIN Write an explanation for the active selection as paragraphs of text.",
					},
					Review = {
						prompt = "/COPILOT_REVIEW Review the selected code.",
					},
					Fix = {
						prompt = "/COPILOT_GENERATE There is a problem in this code. Rewrite the code to fix the problem.",
					},
					Optimize = {
						prompt = "/COPILOT_GENERATE Optimize the selected code to improve performance and readability.",
					},
					Docs = {
						prompt = "/COPILOT_GENERATE Please add documentation comment for the selection.",
					},
					Tests = {
						prompt = "/COPILOT_GENERATE Please generate tests for my code.",
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
				{ "<leader>a", group = "AI" },
				{ "<leader>aa", function() require("CopilotChat").toggle() end, desc = "Toggle CopilotChat" },
				{ "<leader>ax", function() require("CopilotChat").reset() end, desc = "Reset CopilotChat" },
				{ "<leader>aq", function()
					local input = vim.fn.input("Quick Chat: ")
					if input ~= "" then
						require("CopilotChat").ask(input)
					end
				end, desc = "Quick Chat" },
				{ "<leader>ap", function()
					-- Simple command menu without complex picker
					local prompts = {
						"Explain - Write an explanation for the active selection",
						"Review - Review the selected code",
						"Fix - Fix problems in this code",
						"Optimize - Optimize for performance and readability", 
						"Docs - Add documentation comment",
						"Tests - Generate tests for my code",
					}
					
					local prompt_map = {
						["Explain"] = "/COPILOT_EXPLAIN Write an explanation for the active selection as paragraphs of text.",
						["Review"] = "/COPILOT_REVIEW Review the selected code.",
						["Fix"] = "/COPILOT_GENERATE There is a problem in this code. Rewrite the code to fix the problem.",
						["Optimize"] = "/COPILOT_GENERATE Optimize the selected code to improve performance and readability.",
						["Docs"] = "/COPILOT_GENERATE Please add documentation comment for the selection.",
						["Tests"] = "/COPILOT_GENERATE Please generate tests for my code.",
					}
					
					vim.ui.select(prompts, {
						prompt = "Select AI prompt:",
					}, function(choice)
						if choice then
							local key = choice:match("^(%w+)")
							if prompt_map[key] then
								require("CopilotChat").ask(prompt_map[key])
							end
						end
					end)
				end, desc = "Prompt Actions" },
				{ "<leader>at", function()
					local providers = {
						{ 
							name = "🤖 Copilot",
							action = function()
								require("copilot.command").enable()
								local codeium_ok, codeium = pcall(require, "codeium.virtual_text")
								if codeium_ok then
									codeium.set_enabled(false)
								end
								vim.notify("Switched to Copilot", vim.log.levels.INFO)
							end,
						},
						{
							name = "🔮 Codeium",
							action = function()
								require("copilot.suggestion").dismiss()
								require("copilot.command").disable()
								local codeium_ok, codeium = pcall(require, "codeium.virtual_text")
								if codeium_ok then
									codeium.set_enabled(true)
								end
								vim.notify("Switched to Codeium", vim.log.levels.INFO)
							end,
						},
					}
					
					vim.ui.select(providers, {
						prompt = "Select AI Provider:",
						format_item = function(item) return item.name end,
					}, function(choice)
						if choice then
							choice.action()
						end
					end)
				end, desc = "Select AI Provider" },
			})
		end,
	},
}