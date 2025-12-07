const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
  'Frontend/src/pages/Checkout.jsx',
  'Frontend/src/contexts/AuthContext.jsx',
  'Frontend/src/pages/Home.jsx',
  'Frontend/src/services/payment.service.jsx',
  'Frontend/src/lib/authProxy.jsx',
  'Frontend/src/pages/AuthCallback.jsx',
  'Frontend/src/api/askApi.jsx',
  'Frontend/src/pages/Account.jsx',
  'Frontend/src/hooks/useUserProfile.jsx',
  'Frontend/src/hooks/useUsageTracking.jsx',
  'Frontend/src/pages/Register.jsx',
  'Frontend/src/pages/Login.jsx',
  'Frontend/src/pages/Layout.jsx',
  'Frontend/src/pages/PaymentSuccess.jsx',
  'Frontend/src/pages/Pricing.jsx',
  'Frontend/src/pages/ResetPassword.jsx',
  'Frontend/src/components/CodeSnippets.jsx',
  'Frontend/src/components/ApiDocsviewer.jsx',
  'Frontend/src/components/ApiDocumentationInput.jsx',
  'Frontend/src/components/QuestionInput.jsx',
  'Frontend/src/components/FeedbackPopup.jsx',
  'Frontend/src/components/UserProvider.jsx',
  'Frontend/src/services/errorHandler.service.jsx',
  'Frontend/src/services/util.service.jsx',
  'Frontend/src/utils/cookieConsent.jsx',
  'Frontend/src/utils/testApiUrl.jsx',
  'Frontend/src/utils/util.service.jsx',
  'Frontend/src/lib/tranzilaHostedFields.js',
];

function removeConsoleLogs(content) {
  let lines = content.split('\n');
  let result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line contains console statement
    if (trimmed.startsWith('console.log(') ||
        trimmed.startsWith('console.error(') ||
        trimmed.startsWith('console.warn(') ||
        trimmed.startsWith('console.info(') ||
        trimmed.startsWith('console.debug(')) {

      // Check if it's a single-line console statement
      if (trimmed.endsWith(';') || trimmed.endsWith(')')) {
        // Skip this line
        i++;
        continue;
      } else {
        // Multi-line console statement - count parentheses
        let openParens = (line.match(/\(/g) || []).length;
        let closeParens = (line.match(/\)/g) || []).length;
        let depth = openParens - closeParens;

        // Skip until we find closing parenthesis
        i++;
        while (i < lines.length && depth > 0) {
          const nextLine = lines[i];
          openParens = (nextLine.match(/\(/g) || []).length;
          closeParens = (nextLine.match(/\)/g) || []).length;
          depth += openParens - closeParens;
          i++;
        }
        continue;
      }
    }

    result.push(line);
    i++;
  }

  return result.join('\n');
}

function processFile(filePath) {
  const fullPath = path.join(__dirname, filePath);

  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return 0;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const originalLines = content.split('\n').length;

    const cleaned = removeConsoleLogs(content);
    const cleanedLines = cleaned.split('\n').length;

    const removed = originalLines - cleanedLines;

    if (removed > 0) {
      fs.writeFileSync(fullPath, cleaned, 'utf8');
      console.log(`✅ ${filePath}: Removed ${removed} lines`);
    } else {
      console.log(`⚪ ${filePath}: No console logs found`);
    }

    return removed;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function main() {
  console.log('🚀 Starting console log removal...\n');

  let totalRemoved = 0;

  for (const file of filesToProcess) {
    totalRemoved += processFile(file);
  }

  console.log(`\n🎉 Total lines removed: ${totalRemoved}`);
}

main();
