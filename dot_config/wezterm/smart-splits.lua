local w = require("wezterm")

local function is_vim(pane)
	return pane:get_user_vars().IS_NVIM == "true"
end

local direction_keys = {
	h = "Left",
	j = "Down",
	k = "Up",
	l = "Right",
}

local function split_nav(resize_or_move, key, mods)
	return {
		key = key,
		mods = mods,
		action = w.action_callback(function(win, pane)
			if is_vim(pane) then
				win:perform_action({
					SendKey = { key = key, mods = mods },
				}, pane)
			else
				if resize_or_move == "resize" then
					win:perform_action({ AdjustPaneSize = { direction_keys[key], 3 } }, pane)
				else
					win:perform_action({ ActivatePaneDirection = direction_keys[key] }, pane)
				end
			end
		end),
	}
end

local smart_splits_keys = {
	-- Navigace mezi panely s Alt + hjkl
	split_nav("move", "h", "ALT"),
	split_nav("move", "j", "ALT"),
	split_nav("move", "k", "ALT"),
	split_nav("move", "l", "ALT"),

	-- Resize panelů s Alt + šipky
	{
		key = "LeftArrow",
		mods = "ALT",
		action = w.action_callback(function(win, pane)
			if is_vim(pane) then
				win:perform_action({ SendKey = { key = "LeftArrow", mods = "ALT" } }, pane)
			else
				win:perform_action({ AdjustPaneSize = { "Left", 3 } }, pane)
			end
		end),
	},
	{
		key = "DownArrow",
		mods = "ALT",
		action = w.action_callback(function(win, pane)
			if is_vim(pane) then
				win:perform_action({ SendKey = { key = "DownArrow", mods = "ALT" } }, pane)
			else
				win:perform_action({ AdjustPaneSize = { "Down", 3 } }, pane)
			end
		end),
	},
	{
		key = "UpArrow",
		mods = "ALT",
		action = w.action_callback(function(win, pane)
			if is_vim(pane) then
				win:perform_action({ SendKey = { key = "UpArrow", mods = "ALT" } }, pane)
			else
				win:perform_action({ AdjustPaneSize = { "Up", 3 } }, pane)
			end
		end),
	},
	{
		key = "RightArrow",
		mods = "ALT",
		action = w.action_callback(function(win, pane)
			if is_vim(pane) then
				win:perform_action({ SendKey = { key = "RightArrow", mods = "ALT" } }, pane)
			else
				win:perform_action({ AdjustPaneSize = { "Right", 3 } }, pane)
			end
		end),
	},

	-- Vertikální split s Alt + -
	{
		key = "-",
		mods = "ALT",
		action = w.action.SplitVertical({ domain = "CurrentPaneDomain" }),
	},

	-- Horizontální split s Alt + \
	{
		key = "\\",
		mods = "ALT",
		action = w.action.SplitHorizontal({ domain = "CurrentPaneDomain" }),
	},
	{
		key = " ",
		mods = "ALT",
		action = w.action.TogglePaneZoomState,
	},
}

return smart_splits_keys
