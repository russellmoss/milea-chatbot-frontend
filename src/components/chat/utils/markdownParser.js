// src/components/chat/utils/markdownParser.js

/**
 * Simple markdown parser for chat messages
 * Converts markdown syntax to HTML for display in chat bubbles
 * @param {string} text - Raw markdown text
 * @returns {string} - HTML formatted string
 */
const parseMarkdown = (text) => {
    if (!text) return '';
  
    // Process text in multiple passes for better handling
  
    // First process block elements
    let parsed = text
      // Replace headings (## Heading -> <h2>Heading</h2>)
      .replace(/## (.*?)(?:\n|$)/g, '<h2>$1</h2>\n')
      .replace(/# (.*?)(?:\n|$)/g, '<h1>$1</h1>\n');
  
    // Handle lists - this requires special care
    // First, identify list blocks
    const listRegex = /^(\d+\. .*?|\* .*?|- .*?)(?:\n|$)/gm;
    
    // Process numbered lists (1. Item -> proper HTML list)
    let numListPattern = /^(\d+)\. (.*?)(?:\n|$)/gm;
    let hasNumberedList = numListPattern.test(parsed);
    
    if (hasNumberedList) {
      let listItems = [];
      let match;
      numListPattern = /^(\d+)\. (.*?)(?:\n|$)/gm;
      
      while ((match = numListPattern.exec(parsed)) !== null) {
        listItems.push(match[0]);
      }
      
      if (listItems.length > 0) {
        const listBlock = listItems.join('\n');
        const listHtml = '<ol>\n' + 
          listItems.map(item => {
            return `  <li>${item.replace(/^\d+\. /, '')}</li>`;
          }).join('\n') + 
          '\n</ol>';
        
        parsed = parsed.replace(listBlock, listHtml);
      }
    }
    
    // Process bullet lists (* Item or - Item -> proper HTML list)
    let bulletListPattern = /^(\*|\-) (.*?)(?:\n|$)/gm;
    let hasBulletList = bulletListPattern.test(parsed);
    
    if (hasBulletList) {
      let listItems = [];
      let match;
      bulletListPattern = /^(\*|\-) (.*?)(?:\n|$)/gm;
      
      while ((match = bulletListPattern.exec(parsed)) !== null) {
        listItems.push(match[0]);
      }
      
      if (listItems.length > 0) {
        const listBlock = listItems.join('\n');
        const listHtml = '<ul>\n' + 
          listItems.map(item => {
            return `  <li>${item.replace(/^(\*|\-) /, '')}</li>`;
          }).join('\n') + 
          '\n</ul>';
        
        parsed = parsed.replace(listBlock, listHtml);
      }
    }
    
    // Now process inline elements
    parsed = parsed
      // Replace bold (**text** -> <strong>text</strong>)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Replace italic (*text* -> <em>text</em>)
      .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
      
      // Replace links ([text](url) -> <a href="url">text</a>)
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Replace line breaks with <br>
      .replace(/\n/g, '<br>');
    
    return parsed;
  };
  
  export default parseMarkdown;