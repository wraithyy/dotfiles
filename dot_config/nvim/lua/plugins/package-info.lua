return {
	{
		"vuki656/package-info.nvim",
		dependencies = { "MunifTanjim/nui.nvim" },
		ft = "json",
		event = { "BufReadPre package.json" },
		opts = {},
		keys = {
			{
				"<leader>ns",
				function()
					require("package-info").show()
				end,
				desc = "Show dependency versions",
			},
			{
				"<leader>nu",
				function()
					require("package-info").update()
				end,
				desc = "Update dependency on line",
			},
			{
				"<leader>nd",
				function()
					require("package-info").delete()
				end,
				desc = "Delete dependency on line",
			},
			{
				"<leader>np",
				function()
					require("package-info").change_version()
				end,
				desc = "Change dependency version",
			},
			{
				"<leader>ni",
				function()
					require("package-info").install()
				end,
				desc = "Install new dependency",
			},
			{
				"<leader>nt",
				function()
					require("package-info").toggle()
				end,
				desc = "Toggle dependency versions",
			},
		},
	},
}
