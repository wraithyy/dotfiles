return {
	{
		"Davidyz/VectorCode",
		version = "*", -- optional, depending on whether you're on nightly or release
		dependencies = { "nvim-lua/plenary.nvim" },
		cmd = "VectorCode", -- if you're lazy-loading VectorCode
	},
	{
		"olimorris/codecompanion.nvim",
		dependencies = {
			"nvim-lua/plenary.nvim",
			"folke/noice.nvim",
			"nvim-treesitter/nvim-treesitter",
			"Davidyz/VectorCode",
			"ravitemer/mcphub.nvim",
		},
		cmd = {
			"CodeCompanion",
			"CodeCompanionChat",
			"CodeCompanionToggle",
			"CodeCompanionActions",
		},

		keys = {
			{ "<leader>ca", "<cmd>CodeCompanionActions<cr>", mode = { "n", "v" }, desc = "Action Palette" },
			{ "<leader>cc", "<cmd>CodeCompanionChat<cr>", mode = { "n", "v" }, desc = "New Chat" },
			{ "<leader>ci", "<cmd>CodeCompanion<cr>", mode = "n", desc = "Inline Prompt" },
		},
		init = function()
			vim.g.codecompanion_auto_tool_mode = true
			require("config.companion-extension").init()
			local wk = require("which-key")
			wk.add({
				{ "<leader>c", group = "󰚩 CodeCompanion" },
				{ "<leader>ca", desc = "󰘳 Action Palette" },
				{ "<leader>cc", desc = " New Chat" },
				{ "<leader>cA", desc = "󰐕 Add Code" },
				{ "<leader>ci", desc = " Inline Prompt" },
				{ "<leader>cx", desc = "🔄 Switch Adapter" },
			})
		end,
		config = function()
			local cacher = require("vectorcode.config").get_cacher_backend()
			vim.api.nvim_create_autocmd("LspAttach", {
				callback = function()
					local bufnr = vim.api.nvim_get_current_buf()
					cacher.async_check("config", function()
						cacher.register_buffer(bufnr, {
							n_query = 10,
						})
					end, nil)
				end,
				desc = "Register buffer for VectorCode",
			})

			require("codecompanion").setup({
				-- Enable debug logging to troubleshoot action errors
				log_level = "TRACE",

				language = "Czech",
				adapters = {
					opts = {
						show_defaults = false,
					},

					["anthropic-claude"] = function()
						return require("codecompanion.adapters").extend("anthropic", {})
					end,
					["ollama-deepseek-6b"] = function()
						return require("codecompanion.adapters").extend("ollama", {
							model = "deepseek-coder:6.7b",
						})
					end,
					["ollama-deepseek-13b"] = function()
						return require("codecompanion.adapters").extend("ollama", {
							model = "deepseek-coder:13b",
						})
					end,
					copilot = function()
						return require("codecompanion.adapters").extend("copilot", {})
					end,
				},
				strategies = {
					chat = {
						adapter = "anthropic-claude",
						tools = {
							vectorcode = {
								description = "Run VectorCode to retrieve the project context.",

								callback = require("vectorcode.integrations").codecompanion.chat.make_tool(),
							},
							["mcp"] = {
								-- calling it in a function would prevent mcphub from being loaded before it's needed
								callback = function()
									return require("mcphub.extensions.codecompanion")
								end,
								description = "Call tools and resources from the MCP Servers",
								opts = {
									requires_approval = true,
								},
							},
						},
						slash_commands = {
							-- add the vectorcode command here.
							codebase = require("vectorcode.integrations").codecompanion.chat.make_slash_command(),
						},
					},
					agent = {
						adapter = "anthropic-claude",
					},
					inline = {
						adapter = "anthropic-claude",
					},
				},
				display = {
					diff = { provider = "mini_diff" },
					chat = {
						-- show_settings = true,
						show_token_count = true,
						token_count = function(tokens, adapter)
							local input_ratio = 0.8
							local output_ratio = 0.2

							local input_tokens = tokens * input_ratio
							local output_tokens = tokens * output_ratio

							local input_cost = (input_tokens / 1000000) * 3 -- $3 / 1M
							local output_cost = (output_tokens / 1000000) * 15 -- $15 / 1M

							local total_cost = input_cost + output_cost
							return string.format(" (%d tokenů, odhad: $%.4f)", tokens, total_cost)
						end,
					},
				},

				prompt_library = {
					["Generate Types"] = {
						strategy = "chat",
						description = "Generate TypeScript types/interfaces for your code",
						command = "types",
						modes = { "v" },
						prompts = {
							{
								role = "system",
								content = "You are an expert TypeScript developer focused on creating precise, well-documented types and interfaces.",
							},
							{
								role = "user",
								content = function(ctx)
									return string.format(
										[[Generate TypeScript types or interfaces for the following code. Make them strict and well-documented. If there are any potential improvements for type safety, suggest them:

```%s
%s
```]],
										ctx.filetype,
										ctx.selection
									)
								end,
							},
						},
					},
					["Code Review"] = {
						strategy = "chat",
						description = "Review code for best practices and improvements",
						command = "review",
						modes = { "n", "v" },
						prompts = {
							{
								role = "system",
								content = function(ctx)
									return string.format(
										"You are a senior %s developer performing a thorough code review. Focus on best practices, security, and performance.",
										ctx.filetype
									)
								end,
							},
							{
								role = "user",
								content = function(ctx)
									return string.format(
										[[Review this code and provide feedback on:
- Code quality and best practices
- Performance considerations
- Potential bugs
- Code organization
- Error handling
- Security concerns

```%s
%s
```]],
										ctx.filetype,
										ctx.selection or ctx.buffer_content
									)
								end,
							},
						},
					},
				},
			})
		end,
	},
}
