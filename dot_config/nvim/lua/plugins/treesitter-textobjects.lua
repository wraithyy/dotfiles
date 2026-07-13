return {
	{
		"nvim-treesitter/nvim-treesitter-textobjects",
		branch = "main", -- párovat s nvim-treesitter na main branch
		dependencies = { "nvim-treesitter/nvim-treesitter" },
		event = { "BufReadPost", "BufNewFile" },
		config = function()
			require("nvim-treesitter-textobjects").setup({
				select = {
					lookahead = true,
					selection_modes = {
						["@parameter.outer"] = "v",
						["@function.outer"] = "V",
					},
					include_surrounding_whitespace = false,
				},
				move = {
					set_jumps = true,
				},
			})

			local select = require("nvim-treesitter-textobjects.select")
			local move = require("nvim-treesitter-textobjects.move")
			local swap = require("nvim-treesitter-textobjects.swap")

			-- SELECT: af/if function, ac/ic class, aa/ia argument
			local select_map = {
				{ "af", "@function.outer", "Function (outer)" },
				{ "if", "@function.inner", "Function (inner)" },
				{ "ac", "@class.outer", "Class (outer)" },
				{ "ic", "@class.inner", "Class (inner)" },
				{ "aa", "@parameter.outer", "Argument (outer)" },
				{ "ia", "@parameter.inner", "Argument (inner)" },
			}
			for _, m in ipairs(select_map) do
				local lhs, query, desc = m[1], m[2], m[3]
				vim.keymap.set({ "x", "o" }, lhs, function()
					select.select_textobject(query, "textobjects")
				end, { desc = desc })
			end

			-- MOVE: next/prev start & end for functions and classes
			local move_map = {
				{ "]f", "goto_next_start", "@function.outer", "Next function start" },
				{ "]c", "goto_next_start", "@class.outer", "Next class start" },
				{ "]F", "goto_next_end", "@function.outer", "Next function end" },
				{ "]C", "goto_next_end", "@class.outer", "Next class end" },
				{ "[f", "goto_previous_start", "@function.outer", "Previous function start" },
				{ "[c", "goto_previous_start", "@class.outer", "Previous class start" },
				{ "[F", "goto_previous_end", "@function.outer", "Previous function end" },
				{ "[C", "goto_previous_end", "@class.outer", "Previous class end" },
			}
			for _, m in ipairs(move_map) do
				local lhs, fn, query, desc = m[1], m[2], m[3], m[4]
				vim.keymap.set({ "n", "x", "o" }, lhs, function()
					move[fn](query, "textobjects")
				end, { desc = desc })
			end

			-- SWAP: swap argument under cursor with next/previous
			vim.keymap.set("n", "<leader>sa", function()
				swap.swap_next("@parameter.inner")
			end, { desc = "Swap argument with next" })
			vim.keymap.set("n", "<leader>sA", function()
				swap.swap_previous("@parameter.inner")
			end, { desc = "Swap argument with previous" })
		end,
	},
}
