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
            -- Ensure Markview attaches to both markdown and mdx buffers
            preview = {
                filetypes = { "markdown", "markdown.mdx" },
            },
        })
        -- Use markdown parser for markdown.mdx filetype
        vim.treesitter.language.register("markdown", "markdown.mdx")
        -- Correct filetype registration for .mdx extension
        vim.filetype.add({
            extension = { mdx = "markdown.mdx" },
        })
    end,

};
