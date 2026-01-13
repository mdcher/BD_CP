-- Надати право Librarian створювати користувачів
-- Згідно з вимогами: користувачів можуть реєструвати Admin та Librarian

GRANT EXECUTE ON PROCEDURE public.create_user TO role_librarian;
