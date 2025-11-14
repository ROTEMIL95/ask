# תכונת "שכחתי סיסמה" - סיכום

## מה שנוסף

הוספתי תכונה מלאה של איפוס סיסמה לאפליקציה, כולל:

1. **כפתור "Forgot password?" בדף התחברות**
2. **Modal לבקשת איפוס סיסמה**
3. **שליחת מייל עם קישור לאיפוס**
4. **דף חדש לעדכון הסיסמה**

---

## קבצים ששונו/נוצרו

### 1. Frontend/src/lib/supabase.jsx
**נוסף**: פונקציה `resetPassword()`

```javascript
resetPassword: async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { data, error }
}
```

**מה זה עושה**: שולח מייל עם קישור לאיפוס סיסמה דרך Supabase.

---

### 2. Frontend/src/contexts/AuthContext.jsx
**נוסף**: פונקציה `resetPassword()` ב-context

```javascript
const resetPassword = async (email) => {
  // Calls auth.resetPassword from supabase.jsx
  // Returns { success: true/false, message/error }
}
```

**נוסף ל-value**:
```javascript
const value = {
  ...
  resetPassword,  // <-- הוספה
  ...
}
```

**מה זה עושה**: עוטף את הפונקציה מ-supabase.jsx ומספק אותה לכל הקומפוננטות דרך useAuth().

---

### 3. Frontend/src/pages/Login.jsx
**שינויים**:

#### א. הוספת state חדש:
```javascript
const [showForgotPassword, setShowForgotPassword] = useState(false);
const [resetEmail, setResetEmail] = useState('');
const [resetLoading, setResetLoading] = useState(false);
const [resetMessage, setResetMessage] = useState('');
```

#### ב. הוספת פונקציה:
```javascript
const handleForgotPassword = async (e) => {
  e.preventDefault();
  // Validates email
  // Calls resetPassword()
  // Shows success message
  // Closes modal after 3 seconds
}
```

#### ג. שינוי הקישור "Forgot password?":
```javascript
// Before: Link to="#"
// After: Button that opens modal
<button
  type="button"
  onClick={() => setShowForgotPassword(true)}
>
  Forgot password?
</button>
```

#### ד. הוספת Modal:
```javascript
{showForgotPassword && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm...">
    {/* Modal with email input and buttons */}
  </div>
)}
```

---

### 4. Frontend/src/pages/ResetPassword.jsx
**קובץ חדש** - דף מלא לעדכון סיסמה

**תכונות**:
- שדות: סיסמה חדשה + אישור סיסמה
- כפתורי הצגה/הסתרה לסיסמאות
- ולידציה: אורך מינימלי 6 תווים, התאמה בין הסיסמאות
- אחרי הצלחה: הודעת הצלחה + redirect לדף התחברות אחרי 3 שניות

**API שבשימוש**:
```javascript
await supabase.auth.updateUser({ password: newPassword })
```

---

### 5. Frontend/src/pages/index.jsx
**נוסף**:
- Import: `import ResetPassword from "./ResetPassword"`
- ל-PAGES object: `ResetPassword: ResetPassword`
- Route: `<Route path="/reset-password" element={<ResetPassword />} />`

---

## איך זה עובד?

### שלב 1: משתמש שכח סיסמה
1. משתמש נכנס לדף Login
2. לוחץ על **"Forgot password?"**
3. נפתח Modal עם שדה מייל

### שלב 2: בקשת איפוס
1. משתמש מזין מייל
2. לוחץ **"Send Reset Link"**
3. הפונקציה `resetPassword(email)` נקראת
4. Supabase שולח מייל עם קישור

### שלב 3: קבלת מייל
המשתמש מקבל מייל מ-Supabase עם קישור כמו:
```
https://yourdomain.com/reset-password?token=xxxxx
```

### שלב 4: עדכון סיסמה
1. משתמש לוחץ על הקישור במייל
2. נפתח דף `/reset-password`
3. משתמש מזין סיסמה חדשה
4. לוחץ **"Update Password"**
5. הסיסמה מתעדכנת ב-Supabase
6. redirect לדף Login

### שלב 5: התחברות
משתמש מתחבר עם הסיסמה החדשה ✅

---

## הגדרות נדרשות ב-Supabase

### 1. Email Templates
עבור ל-Supabase Dashboard → Authentication → Email Templates

**ודא ש-"Reset Password" template מוגדר נכון**:
- Subject: "Reset Your Password"
- Confirmation URL: `{{ .SiteURL }}/reset-password`

### 2. Site URL
עבור ל-Supabase Dashboard → Settings → API

**הגדר Site URL**:
- Development: `http://localhost:5173`
- Production: `https://yourdomain.com`

### 3. Redirect URLs
ב-Authentication → URL Configuration

**הוסף**:
- `http://localhost:5173/reset-password` (development)
- `https://yourdomain.com/reset-password` (production)

---

## בדיקה

### 1. רענן דפדפן
```bash
Ctrl + Shift + R
```

### 2. נסה "Forgot Password"
1. עבור ל: http://localhost:5173/Login
2. לחץ **"Forgot password?"**
3. הזן מייל (של משתמש קיים ב-Supabase)
4. לחץ **"Send Reset Link"**

### 3. בדוק Console
צפוי לראות:
```
🔐 Requesting password reset for: user@example.com
✅ Password reset email sent
```

### 4. בדוק מייל
1. פתח את תיבת המייל
2. חפש מייל מ-Supabase
3. לחץ על הקישור

### 5. עדכן סיסמה
1. הזן סיסמה חדשה (6+ תווים)
2. אשר את הסיסמה
3. לחץ **"Update Password"**

צפוי לראות:
```
🔐 Updating password...
✅ Password updated successfully
```

### 6. התחבר עם סיסמה חדשה
חזור לדף Login והתחבר עם הסיסמה החדשה ✅

---

## שגיאות אפשריות ופתרונות

### שגיאה: "Invalid or expired reset link"
**סיבה**: הקישור פג תוקף (בדרך כלל אחרי שעה)
**פתרון**: בקש קישור חדש

### שגיאה: "Failed to send password reset email"
**סיבה**: המייל לא קיים ב-Supabase או יש בעיה ב-configuration
**פתרון**:
1. בדוק שהמשתמש קיים ב-Authentication → Users
2. בדוק Email Templates ב-Supabase
3. בדוק שה-Site URL מוגדר נכון

### שגיאה: "Password must be at least 6 characters"
**סיבה**: הסיסמה קצרה מדי
**פתרון**: השתמש בסיסמה של 6 תווים לפחות

### שגיאה: "Passwords do not match"
**סיבה**: הסיסמאות לא זהות
**פתרון**: הקלד אותה סיסמה בשני השדות

### המודל לא נפתח
**סיבה**: React לא טען את השינויים
**פתרון**: Hard refresh (Ctrl+Shift+R)

### המייל לא מגיע
**סיבות אפשריות**:
1. המייל בתיקיית SPAM - בדוק שם
2. Email provider חוסם - בדוק ב-Supabase logs
3. Email template לא מוגדר - בדוק ב-Supabase dashboard

---

## UI/UX

### דף Login - Modal
- רקע כהה עם blur
- טופס פשוט עם שדה מייל אחד
- 2 כפתורים: Cancel / Send Reset Link
- Spinner בזמן שליחה
- הודעת הצלחה בירוק
- Modal נסגר אוטומטית אחרי 3 שניות

### דף Reset Password
- עיצוב תואם לדף Login
- 2 שדות סיסמה עם כפתורי הצגה/הסתרה
- ולידציה בזמן אמת
- הודעת שגיאה באדום
- הודעת הצלחה עם אייקון ✓
- Redirect אוטומטי אחרי 3 שניות

---

## אבטחה

✅ **Supabase מטפל באבטחה**:
- Token בקישור האיפוס תקף רק לזמן מוגבל
- הסיסמה נשמרת מוצפנת (hashed)
- אין אפשרות לאפס סיסמה בלי גישה למייל
- Token חד-פעמי - לא ניתן לשימוש חוזר

✅ **הקוד שלנו**:
- לא שומר סיסמאות בצד הלקוח
- מאמת אורך סיסמה מינימלי
- דורש התאמה בין הסיסמאות
- מציג הודעות שגיאה ידידותיות (לא חושף פרטים טכניים)

---

## לסיכום

✅ תכונת "שכחתי סיסמה" מוכנה ופועלת
✅ UI/UX ידידותי ומעוצב
✅ אינטגרציה מלאה עם Supabase Auth
✅ ולידציה ואבטחה
✅ הודעות שגיאה והצלחה ברורות

**מוכן לשימוש!** 🎉

---

**תאריך**: 2025-11-13
**קבצים שונו**: 4 (1 חדש)
**שורות קוד**: ~350
