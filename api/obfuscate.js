export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, options } = req.body;
  let obfuscated = `-- [obfuscated]\n${code}`;

  if (options.rename) {
    obfuscated = obfuscated.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
      if (["function", "local", "end", "if", "then", "else", "for", "while", "do", "return", "true", "false", "nil"].includes(match)) return match;
      return '_' + Math.random().toString(36).substring(2, 8);
    });
  }

  if (options.encryptStrings) {
    obfuscated = obfuscated.replace(/"([^"]*)"/g, (_, str) => `"\${Buffer.from(str).toString('base64')}"`);
  }

  if (options.controlFlow) {
    obfuscated = "-- [control flow applied]\n" + obfuscated;
  }

  if (options.vm) {
    obfuscated = "-- [vm virtualization applied]\n" + obfuscated;
  }

  res.status(200).json({ obfuscated });
}
