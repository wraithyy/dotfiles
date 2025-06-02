require("which-key").add({
	{ "<leader>u", desc = "Toggle undotree", icon = "" },
})
return {
	"mbbill/undotree",
	cmd = "UndotreeToggle",
	keys = {
		{ "<leader>u", "<cmd>UndotreeToggle<CR>", desc = "Toggle undotree" },
	},
}
