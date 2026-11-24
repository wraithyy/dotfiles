// Same rule as ~/.local/bin/wt: lowercase, runs of non-alphanumerics become "-".
export const slugify = (text) => (text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const expandHome = (path, home) => (path === "~" || path.startsWith("~/") ? `${home}${path.slice(1)}` : path);
