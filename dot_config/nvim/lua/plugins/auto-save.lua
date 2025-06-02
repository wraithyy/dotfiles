require("which-key").add({
	{ "<leader>sf", ":ASToggle<CR>", desc = "Toggle file auto-save" },
})
return {
	"okuuva/auto-save.nvim",
	cmd = "ASToggle", -- optional for lazy loading on command
	event = { "InsertLeave", "TextChanged" }, -- optional for lazy loading on trigger events
	opts = {
		debounce_delay = 4500, -- your config goes here
	},
}
