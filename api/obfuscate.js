export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, options } = req.body;
  let obfuscated = code;

  if (options.rename) {
    const reserved = ["function", "local", "end", "if", "then", "else", "for", "while", "do", "return", "true", "false", "nil"];
    const used = new Set();
    obfuscated = obfuscated.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
      if (reserved.includes(match) || used.has(match)) return match;
      const newName = "_x" + Math.random().toString(36).substring(2, 10);
      used.add(match);
      return newName;
    });
  }

  if (options.encryptStrings) {
    const xorKey = 69;
    const encodeLua = `local function _d(s,k)local b=""for i=1,#s do b=b..string.char(bit32.bxor(string.byte(s,i),k))end return b end\n`;
    obfuscated = obfuscated.replace(/"([^"]*)"/g, (_, str) => {
      const xored = Buffer.from(str.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ xorKey)).join('')).toString("latin1");
      const escaped = xored.replace(/[^\x20-\x7E]/g, c => "\\x" + c.charCodeAt(0).toString(16).padStart(2, '0'));
      return `_d("${escaped}",${xorKey})`;
    });
    obfuscated = encodeLua + obfuscated;
  }

  if (options.controlFlow) {
    obfuscated = "local _=function(...)return select('#',...)end; " + obfuscated;
  }

  if (options.vm) {
    obfuscated = "--[[vm_start]] " + obfuscated + " --[[vm_end]]";
  }

  obfuscated = "return(function() " + obfuscated + " end)()";

  res.status(200).json({ obfuscated });
}
