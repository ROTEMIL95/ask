const fs = require('fs');
const path = require('path');

// Files to process
const files = [
  'Frontend/src/components/ApiDocsviewer.jsx',
  'Frontend/src/components/ApiDocumentationInput.jsx',
  'Frontend/src/api/askApi.jsx',
  'Frontend/src/contexts/AuthContext.jsx',
  'Frontend/src/components/CodeSnippets.jsx',
  'Frontend/src/components/FeedbackPopup.jsx',
  'Frontend/src/hooks/useUserProfile.jsx',
  'Frontend/src/hooks/useUsageTracking.jsx',
  'Frontend/src/lib/tranzilaHostedFields.js',
  'Frontend/src/pages/Checkout.jsx',
  'Frontend/src/lib/supabase.jsx',
  'Frontend/src/lib/authProxy.jsx',
  'Frontend/src/pages/AuthCallback.jsx',
  'Frontend/src/pages/Home.jsx',
  'Frontend/src/pages/Layout.jsx',
  'Frontend/src/pages/Account.jsx',
  'Frontend/src/pages/PaymentSuccess.jsx',
  'Frontend/src/pages/Register.jsx',
  'Frontend/src/pages/Pricing.jsx',
  'Frontend/src/pages/ResetPassword.jsx',
  'Frontend/src/services/util.service.jsx',
  'Frontend/src/services/errorHandler.service.jsx',
  'Frontend/src/services/payment.service.jsx',
  'Frontend/src/components/QuestionInput.jsx',
  'Frontend/src/components/UserProvider.jsx',
  'Frontend/src/setupTests.js',
  'Frontend/src/utils/cookieConsent.jsx',
  'Frontend/src/utils/util.service.jsx',
  'Frontend/src/utils/testApiUrl.jsx'
];

let totalRemoved = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalLines = content.split('\n').length;

  // Remove console.log, console.warn, console.error, console.info, console.debug
  // This regex handles:
  // - Single line: console.log('test')
  // - Multi-line: console.log(\n  'test'\n)
  // - With semicolons or without
  // - Indented statements

  let linesRemoved = 0;

  // Remove standalone console statements (entire lines)
  content = content.replace(/^[ \t]*console\.(log|warn|error|info|debug)\([^)]*\);?\s*$/gm, () => {
    linesRemoved++;
    return '';
  });

  // Remove multi-line console statements
  content = content.replace(/^[ \t]*console\.(log|warn|error|info|debug)\([^)]*[\r\n]+[^)]*\);?\s*$/gm, () => {
    linesRemoved++;
    return '';
  });

  // More aggressive multi-line removal (for deeply nested parentheses)
  let previousContent;
  do {
    previousContent = content;
    content = content.replace(/^[ \t]*console\.(log|warn|error|info|debug)\([\s\S]*?\);?\s*$/gm, (match) => {
      // Only remove if parentheses are balanced
      let openCount = (match.match(/\(/g) || []).length;
      let closeCount = (match.match(/\)/g) || []).length;
      if (openCount === closeCount) {
        linesRemoved++;
        return '';
      }
      return match;
    });
  } while (content !== previousContent);

  // Remove empty lines that were left behind (max 2 consecutive empty lines)
  content = content.replace(/\n\n\n+/g, '\n\n');

  // Write back
  fs.writeFileSync(filePath, content, 'utf8');

  const newLines = content.split('\n').length;
  const removed = originalLines - newLines;

  if (removed > 0) {
    console.log(`✅ ${file}: Removed ${removed} lines`);
    totalRemoved += removed;
  } else {
    console.log(`⏭️  ${file}: No changes`);
  }
});

console.log(`\n🎉 Total lines removed: ${totalRemoved}`);
