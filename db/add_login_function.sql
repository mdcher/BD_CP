-- Функція для логіну користувача
CREATE OR REPLACE FUNCTION public.login(p_contactinfo character varying)
    RETURNS TABLE(
                     userid integer,
                     fullname character varying,
                     contactinfo character varying,
                     role public.role,
                     password_hash character varying
                 ) AS $$
BEGIN
    RETURN QUERY
        SELECT u.userid, u.fullname, u.contactinfo, u.role, u.password_hash
        FROM public.users u
        WHERE u.contactinfo = p_contactinfo;
END;
$$ LANGUAGE plpgsql;
