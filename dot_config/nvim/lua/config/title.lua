-- === Neovim -> Ghostty tab title: "Neovim - <název_projektu>" ===

-- Kompatibilita uv/loop (Neovim 0.9/0.10+)
local uv = vim.uv or vim.loop

local function detect_project_root()
  local cwd = uv.cwd() or vim.fn.getcwd()
  -- Markery, které definují "root" (pořadí od nejběžnějších)
  local markers = {
    ".git",
    "pnpm-workspace.yaml",
    "package.json",
    "turbo.json",
    "nx.json",
    "go.mod",
    "Cargo.toml",
    "pyproject.toml",
    ".hg",
  }

  -- Najdi první marker směrem nahoru od CWD
  local found = vim.fs.find(markers, { upward = true, path = cwd })[1]
  local root = found and vim.fs.dirname(found) or cwd

  -- Vrať jen název složky (basename)
  return vim.fn.fnamemodify(root, ":t")
end

local function update_titlestring()
  vim.opt.title = true
  vim.opt.titlestring = "NeoVIM - " .. detect_project_root()
end

-- Aktualizace titulku při vstupu do Nvim, změně adresáře, přepínání bufferů apod.
local grp = vim.api.nvim_create_augroup("ghostty_title_project_root", { clear = true })
vim.api.nvim_create_autocmd({ "VimEnter", "BufEnter", "DirChanged", "LspAttach" }, {
  group = grp,
  callback = update_titlestring,
})

-- Pro jistotu nastav i hned při načtení
update_titlestring()
