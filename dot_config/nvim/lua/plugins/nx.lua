local wezterm_vertical_split_and_send = function(command)
	-- Získání seznamu panelů pomocí wezterm cli list
	local handle = io.popen("wezterm cli list --format json")
	local wezterm_output = handle:read("*a")
	handle:close()

	if wezterm_output == "" then
		print("Chyba: Nepodařilo se získat seznam panelů.")
		return
	end

	-- Parsování JSON výstupu
	local wezterm_data = vim.fn.json_decode(wezterm_output)

	-- Najdi aktivní panel
	local active_pane
	for _, pane in ipairs(wezterm_data) do
		if pane.is_active then
			active_pane = pane
			break
		end
	end

	if not active_pane then
		print("Chyba: Nebyl nalezen žádný aktivní panel.")
		return
	end

	-- Najdi všechny panely v aktuálním okně
	local active_window_panes = {}
	for _, pane in ipairs(wezterm_data) do
		if pane.window_id == active_pane.window_id then
			table.insert(active_window_panes, pane)
		end
	end

	-- Rozhodni, jak splitovat
	local split_cmd
	if #active_window_panes == 1 then
		-- Pokud je pouze jeden panel, vytvoř vertikální split
		split_cmd = string.format("wezterm cli split-pane --pane-id %d", active_pane.pane_id)
	else
		-- Pokud jsou dva panely, splituj spodní panel horizontálně
		local bottom_pane = active_window_panes[#active_window_panes]
		split_cmd = string.format("wezterm cli split-pane --horizontal --pane-id %d", bottom_pane.pane_id)
	end

	-- Vytvoř nový split
	local split_handle = io.popen(split_cmd)
	local new_pane_id = split_handle:read("*a"):gsub("%s+", "")
	split_handle:close()

	if new_pane_id == "" then
		print("Chyba: Nepodařilo se vytvořit nový split.")
		return
	end

	-- Odeslání příkazu do nového panelu
	local wezterm_cmd = string.format('wezterm cli send-text --pane-id %s "%s"', new_pane_id, command)
	os.execute(wezterm_cmd)
end

require("which-key").add({

	{ "<leader>nx", desc = "Open NX actions", icon = "" },
	{ "<leader>n", desc = "Nx actions", icon = "" },
})
return {
	"Equilibris/nx.nvim",
	lazy = true,
	keys = {
		{ "<leader>nx", "<cmd>Telescope nx actions<CR>", desc = "Open nx actions" },
	},
	-- dependencies = {
	-- 	"nvim-telescope/telescope.nvim",
	-- },
	config = function()
		local nx = require("nx")

		nx.setup({
			nx_cmd_root = "nx", -- Set the command root
			-- command_runner = require("nx.command-runners").terminal_cmd(),
			-- command_runner = require("nx.command-runners").wezterm_cmd(wezterm_vertical_split_and_send),
			command_runner = function(cmd) -- Přepis funkce pro spuštění příkazu
				-- Odešli příkaz do WezTermu
				wezterm_vertical_split_and_send(cmd)
			end,
		})

		-- Keybinding to open Telescope for nx actions
	end,
}
