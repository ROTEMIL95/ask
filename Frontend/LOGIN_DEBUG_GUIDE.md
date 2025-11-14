# מדריך דיבוג בעיית התחברות

## הבעיה
משתמשים מדווחים שהמערכת לא מזהה את הסיסמה בעת התחברות.

## צעדים לדיבוג

### 1. פתח את Console בדפדפן
לחץ על F12 ופתח את ה-Console

### 2. נסה להתחבר
הזן את פרטי המשתמש ולחץ Sign In

### 3. בדוק את הלוגים
חפש את הלוגים הבאים:

```
Attempting to sign in with email!!!: [email]
🚀 ~ signIn ~ error: [error object]
🚀 ~ signIn ~ data: [data object]
```

### 4. בדוק מה השגיאה
- אם רואים `error: { message: "Invalid login credentials" }` - הסיסמה או המייל שגויים
- אם רואים `error: { message: "Email not confirmed" }` - המשתמש לא אישר את המייל
- אם רואים `error: null` אבל `data: null` - יש בעיה עם Supabase

### 5. בדוק localStorage
1. בדוק Application → Local Storage
2. חפש מפתח שמתחיל ב-`sb-` ומסתיים ב-`-auth-token`
3. אם **קיים לפני ההתחברות** - זה יכול לגרום לבעיה
4. אם **לא קיים אחרי התחברות מוצלחת** - authProxy לא שמר את הסשן

### 6. בדוק Network
1. פתח Network tab
2. נסה להתחבר שוב
3. חפש קריאה ל-`signInWithPassword` או `auth/v1/token`
4. בדוק:
   - Status Code (200 = הצלחה, 400 = סיסמה שגויה)
   - Response body

## תסריטי בעיות נפוצות

### תסריט 1: "Invalid login credentials"
**סיבה**: הסיסמה או המייל שגויים
**פתרון**:
1. בדוק שהמשתמש קיים בטבלת auth.users ב-Supabase
2. נסה לאפס סיסמה
3. בדוק שהמייל נכתב נכון (ללא רווחים)

### תסריט 2: localStorage נוקה תמיד
**סיבה**: יתכן שהשינויים שלנו ב-signOut מנקים גם signIn
**פתרון**: בדוק שב-signOut אנחנו מנקים רק בזמן logout ולא בזמן login

### תסריט 3: Session לא נשמר
**סיבה**: authProxy.signIn לא שומר ל-localStorage
**פתרון**: בדוק ש-`result.data?.session` קיים אחרי signIn

### תסריט 4: אין שגיאה אבל גם לא הצלחה
**סיבה**: Supabase לא עונה או יש בעיית רשת
**פתרון**: בדוק חיבור לאינטרנט, בדוק credentials ב-.env

## פקודות דיבוג בקונסול

### בדיקת session נוכחי:
```javascript
const sessionKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
const session = localStorage.getItem(sessionKey)
console.log('Current session:', session)
```

### ניקוי ידני של session:
```javascript
const sessionKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
localStorage.removeItem(sessionKey)
console.log('Session cleared')
```

### בדיקת Supabase credentials:
```javascript
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
```

## מידע נוסף נדרש

כדי לעזור בדיבוג, אני צריך לדעת:
1. **מהי השגיאה המדויקת** שהמשתמשים רואים?
2. **האם המשתמשים היו מחוברים לפני** ועכשיו לא מצליחים?
3. **האם זה קורה לכל המשתמשים** או רק לחלק?
4. **מה מופיע בקונסול** כשמנסים להתחבר?
5. **האם זה קרה אחרי שתיקנו את ה-logout** או גם לפני?

אם השגיאה היא "Invalid login credentials" אבל הסיסמה נכונה, ייתכן שהבעיה היא ב-Supabase RLS policies או שהמשתמש לא קיים במערכת.
