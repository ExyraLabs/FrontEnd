"use client";
import Markdown from "markdown-to-jsx";

interface MarkdownRendererProps {
  content?: string;
  className?: string;
}

const defaultMarkdown = `# Welcome to the Markdown Renderer Test

This is a **comprehensive test** of the markdown renderer with various elements.

## Headers and Text

### This is a level 3 header

Here's some regular text with *italic* and **bold** formatting.

You can also use ~~strikethrough~~ text and \`inline code\`.

## Lists

### Unordered List
- First item
- Second item with **bold text**
- Third item with *italic text*
  - Nested item 1
  - Nested item 2

### Ordered List
1. First numbered item
2. Second numbered item
3. Third numbered item
   1. Nested numbered item
   2. Another nested item

## Code Blocks

Here's a JavaScript code block:

\`\`\`javascript
function greetUser(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to the app, \${name}\`;
}

const user = "Developer";
greetUser(user);
\`\`\`

And here's a Python example:

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Generate first 10 fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
\`\`\`

## Blockquotes

> This is a blockquote with some important information.
> 
> It can span multiple lines and include **formatting**.

> ### Quote with header
> This blockquote has a header inside it.

## Links and Images

Visit [OpenAI](https://openai.com) for more information.

You can also use reference-style links like [this one][ref-link].

[ref-link]: https://github.com

## Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Markdown Rendering | ✅ Complete | High |
| Syntax Highlighting | 🚧 In Progress | Medium |
| Table Support | ✅ Complete | Low |

## Horizontal Rule

---

## Task Lists

- [x] Set up markdown renderer
- [x] Add default content
- [ ] Test all features
- [ ] Deploy to production

## Emphasis and Strong

This text has *emphasis* and this has **strong importance**.

You can also combine them: ***bold and italic***.

## Special Characters

Here are some special characters: & < > " '

## Math (if supported)

The quadratic formula: ax² + bx + c = 0

## Final Notes

This default content helps test various markdown elements to ensure the renderer works correctly with different types of content.

> **Note**: This is just test content. Replace the \`content\` prop with your actual markdown when using the component.
`;

export default function MarkdownRenderer({
  content = defaultMarkdown,
  className = "",
}: MarkdownRendererProps) {
  return (
    <Markdown
      // remarkPlugins={[remarkGfm]}
      className={`mono text-sm scrollbar-hide whitespace-pre-wrap 
        prose-h1:mb-4 prose-h1:mt-6 prose-h1:text-3xl prose-h1:font-bold prose-h1:border-b prose-h1:pb-2
        prose-h2:mb-3 prose-h2:mt-5 prose-h2:text-2xl prose-h2:font-semibold 
        prose-h3:mb-2 prose-h3:mt-4 prose-h3:text-xl prose-h3:font-medium
        prose-h4:mb-2 prose-h4:mt-3 prose-h4:text-lg prose-h4:font-medium
        prose-h5:mb-1 prose-h5:mt-2 prose-h5:text-base prose-h5:font-medium
        prose-h6:mb-1 prose-h6:mt-2 prose-h6:text-sm prose-h6:font-medium
        prose-p:mb-4 prose-p:leading-relaxed
        prose-strong:font-bold prose-em:italic
        prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4
        prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:my-4
        prose-ul:list-disc prose-ul:ml-6 prose-ul:my-4
        prose-ol:list-decimal prose-ol:ml-6 prose-ol:my-4
        prose-li:my-1 prose-li:leading-relaxed
        prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
        prose-table:border-collapse prose-table:w-full prose-table:my-4
        prose-thead:bg-gray-50
        prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
        prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
        prose-tr:border-b prose-tr:border-gray-200
        prose-hr:border-gray-300 prose-hr:my-6
        prose-img:max-w-full prose-img:h-auto prose-img:rounded
        dark:text-white dark:prose-code:bg-gray-800 dark:prose-code:text-gray-200
        dark:prose-pre:bg-gray-800 dark:prose-blockquote:border-gray-600 dark:prose-blockquote:text-gray-400
        dark:prose-th:bg-gray-800 dark:prose-th:border-gray-600 dark:prose-td:border-gray-600
        dark:prose-hr:border-gray-600 dark:prose-a:text-blue-400 hover:dark:prose-a:text-blue-300
        ${className}`}
    >
      {content}
    </Markdown>
  );
}
