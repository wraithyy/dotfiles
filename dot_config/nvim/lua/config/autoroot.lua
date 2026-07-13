-- Markers indicating a project root, in priority order.
local root_markers = { ".git", "Makefile", "package.json", "pyproject.toml", "Cargo.toml", "go.mod" }

local function set_root()
	local root = vim.fs.root(0, root_markers)
	if root then
		vim.uv.chdir(root)
	end
end

local root_augroup = vim.api.nvim_create_augroup("MyAutoRoot", { clear = true })
vim.api.nvim_create_autocmd("BufEnter", { group = root_augroup, callback = set_root })
