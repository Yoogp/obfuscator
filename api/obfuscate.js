export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, options } = req.body;
  let obfuscated = code;

  // Reserved + Roblox-specific globals to avoid renaming
  const reserved = ["function", "local", "end", "if", "then", "else", "for", "while", "do", "return", "true", "false", "nil",
                    "game", "workspace", "script", "wait", "spawn", "print", "warn", "require", "loadstring", "getfenv",
                    "setfenv", "getgenv", "getrawmetatable", "setreadonly", "hookfunction", "typeof"];

  if (options.rename) {
    const used = new Set();
    obfuscated = obfuscated.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
      if (reserved.includes(match) || used.has(match)) return match;
      const newName = "_x" + Math.random().toString(36).substring(2, 9);
      used.add(match);
      return newName;
    });
  }

  if (options.encryptStrings) {
    const xorKey = 69;
    const encodeLua = `
local function _d(s,k)local b=""for i=1,#s do local c=tonumber(s:sub(i*2-1,i*2),16)b=b..string.char(bit32 and bit32.bxor(c,k) or c ~ k)end return b end
`;
    obfuscated = obfuscated.replace(/"([^"]*)"/g, (_, str) => {
      const hexed = str.split('').map(c => {
        const xor = c.charCodeAt(0) ^ xorKey;
        return xor.toString(16).padStart(2, '0');
      }).join('');
      return `_d("${hexed}",${xorKey})`;
    });
    obfuscated = encodeLua + obfuscated;
  }

  if (options.controlFlow) {
    obfuscated = "local _=function(...)return select('#',...)end; " + obfuscated;
  }

  if (options.vm) {
    obfuscated = "--[[vm_start]] " + obfuscated + " --[[vm_end]]";
  }

  // Ensure script executes safely on Roblox with a valid wrapper
  obfuscated = "return(function() " + obfuscated + " end)()";

  res.status(200).json({ obfuscated });
}
