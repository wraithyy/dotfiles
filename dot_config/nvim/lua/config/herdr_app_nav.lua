-- herdr-app: the app forwards alt-hjkl / alt-arrows to nvim (herdr-app mods/fellowship-status/nav.js).
-- Move between nvim splits; at an edge hand the move back to the app.
if not vim.env.HC_TERMINAL_ID or vim.env.HERDR_ENV == "1" then
	return
end

for key, dir in pairs({ h = "left", j = "down", k = "up", l = "right" }) do
	vim.keymap.set("n", "<A-" .. key .. ">", function()
		local before = vim.api.nvim_get_current_win()
		vim.cmd("wincmd " .. key)
		if vim.api.nvim_get_current_win() == before then
			vim.system({ "herdr-app", "do", "pane.go", vim.json.encode({ direction = dir }) })
		end
	end, { desc = "Split / herdr-app pane " .. dir })
end

for key, cmd in pairs({ Left = "vertical resize -3", Right = "vertical resize +3", Up = "resize +2", Down = "resize -2" }) do
	vim.keymap.set("n", "<A-" .. key .. ">", "<cmd>" .. cmd .. "<cr>", { desc = "Resize split" })
end
