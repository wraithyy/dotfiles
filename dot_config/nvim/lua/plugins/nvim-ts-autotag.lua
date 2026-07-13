return {
	{
		"windwp/nvim-ts-autotag",
		event = { "BufReadPost", "BufNewFile" },
		ft = {
			"html",
			"xml",
			"javascript",
			"javascriptreact",
			"typescript",
			"typescriptreact",
			"tsx",
			"jsx",
			"vue",
			"svelte",
			"astro",
			"markdown",
		},
		opts = {},
	},
}
