return {
	dir = "/Users/wraithy/Development/nvim-mcp-multi",
	name = "nvim-mcp-multi",
	lazy = false, -- Okamžité načtení
	config = function()
		require("nvim-mcp-multi").setup({
			registry_path = "/tmp/nvim-mcp-test-registry",
		})

		-- Debug info
		print("nvim-mcp-multi loaded successfully!")
	end,
}
