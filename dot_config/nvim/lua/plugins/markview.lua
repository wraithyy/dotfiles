return {
    "OXY2DEV/markview.nvim",
    lazy = false,

    -- For blink.cmp's completion
    -- source
    dependencies = {
        "saghen/blink.cmp"
    },
	    config = function()
	require("markview").setup({
	    -- Your configuration here
	})
		 vim.treesitter.language.register("markdown", "mdx")
		vim.filetype.add({mdx = "markdown.mdx"})
    end,

};
