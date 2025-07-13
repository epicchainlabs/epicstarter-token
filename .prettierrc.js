module.exports = {
  semi: true,
  trailingComma: "es5",
  singleQuote: false,
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  quoteProps: "as-needed",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  endOfLine: "lf",
  embeddedLanguageFormatting: "auto",
  htmlWhitespaceSensitivity: "css",
  insertPragma: false,
  jsxSingleQuote: false,
  proseWrap: "preserve",
  requirePragma: false,
  vueIndentScriptAndStyle: false,
  overrides: [
    {
      files: "*.sol",
      options: {
        printWidth: 80,
        tabWidth: 4,
        useTabs: false,
        singleQuote: false,
        bracketSpacing: false,
        explicitTypes: "always",
      },
    },
    {
      files: "*.json",
      options: {
        printWidth: 200,
      },
    },
    {
      files: "*.md",
      options: {
        proseWrap: "always",
        printWidth: 80,
      },
    },
    {
      files: "*.yml",
      options: {
        singleQuote: true,
      },
    },
  ],
};
