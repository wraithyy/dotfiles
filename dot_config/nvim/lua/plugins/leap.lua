return {
	{
		'ggandor/leap.nvim',
		config = function()
			require('leap').add_default_mappings()
			vim.keymap.set({ 'n', 'x', 'o' }, 'ga', function()
				require('leap.treesitter').select()
			end)
		end,
	}
}
