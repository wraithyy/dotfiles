return {
	"DanWlker/toolbox.nvim",
	keys = { "<leader>fc" },
	config = function()
		require("toolbox").setup({
			commands = {
				--replace the bottom few with your own custom functions
				{
					name = "Format Json",
					execute = "%!jq '.'",
					require_input = true,
				},
				{
					name = "Try in visual mode!", --this works in visual mode as well!
					execute = "s/leader/thing",
				},
				{
					name = "Inspect Vim Table",
					execute = function(v)
						print(vim.inspect(v))
					end,
				},
				{
					name = "Copy Vim Table To Clipboard",
					execute = function(v)
						vim.fn.setreg("+", vim.inspect(v))
					end,
				},
				{
					name = "Reload plugin",
					execute = function(name)
						package.loaded[name] = nil
						require(name).setup()
					end,
				},
			},
		})

		vim.keymap.set({ "n", "v" }, "<leader>fx", require("toolbox").show_picker, { desc = "Find Custom Commands" })
	end,
}
