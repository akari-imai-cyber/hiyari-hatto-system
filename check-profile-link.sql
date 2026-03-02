-- profilesテーブルとauth.usersのIDが一致するか確認
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role,
    c.company_name,
    c.company_code
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
WHERE au.email = 'nlp-test@company.local';
