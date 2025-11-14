# פתרון פשוט להתנתקות

## הבעיה
`supabase.auth.signOut()` נתקע ולא חוזר, מה שגורם ל-loop.

## הפתרון
במקום לחכות ל-Supabase, אנחנו:
1. מנקים localStorage **מיד**
2. מנקים את ה-user state **מיד**
3. עוברים לדף הבית **מיד**
4. מנסים להתקשר ל-Supabase ברקע עם timeout

## מה שונה
- **לפני**: חיכינו ל-`supabase.auth.signOut()` להסתיים (נתקע)
- **אחרי**: מנקים הכל מיד, ואז מנסים להתקשר ל-Supabase עם timeout של 2 שניות

## קבצים ששונו
1. `Frontend/src/lib/supabase.jsx` - signOut עם timeout
2. `Frontend/src/contexts/AuthContext.jsx` - signOut עם timeout

## בדיקה
1. רענן דפדפן (Ctrl+Shift+R)
2. התחבר
3. לחץ Logout
4. אמור להתנתק תוך שניה-שתיים מקסימום

## לוגים צפויים
```
🚪 Starting logout...
🚪 AuthContext: Starting signOut...
🚪 Starting sign out process...
🗑️ Clearing session from localStorage: sb-xxxxx-auth-token
✅ localStorage cleared
✅ Sign out completed (after 0-2 seconds)
✅ AuthContext: User state cleared
✅ Successfully signed out
```

אם Supabase לא עונה תוך 2 שניות:
```
⏱️ Supabase signOut timeout - continuing anyway
✅ Sign out completed
```
