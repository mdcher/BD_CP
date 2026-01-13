-- Створення процедури для оплати штрафів
-- Дозволяє читачам оплачувати власні штрафи
-- Дозволяє бухгалтерам та адмінам оплачувати будь-які штрафи

CREATE OR REPLACE PROCEDURE public.pay_fine(
    p_fine_id integer,
    p_paid_by_user_id integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_fine_user_id integer;
    v_current_user_role text;
    v_is_paid boolean;
BEGIN
    -- Отримуємо інформацію про штраф
    SELECT userid, ispaid INTO v_fine_user_id, v_is_paid
    FROM public.fines
    WHERE fineid = p_fine_id;

    -- Перевіряємо, чи існує штраф
    IF v_fine_user_id IS NULL THEN
        RAISE EXCEPTION 'Fine with ID % not found', p_fine_id;
    END IF;

    -- Перевіряємо, чи вже оплачено
    IF v_is_paid THEN
        RAISE EXCEPTION 'Fine with ID % is already paid', p_fine_id;
    END IF;

    -- Отримуємо роль поточного користувача
    SELECT role INTO v_current_user_role
    FROM public.users
    WHERE userid = p_paid_by_user_id;

    -- Перевіряємо права доступу:
    -- Читач може оплатити тільки свій штраф
    -- Бухгалтер та Адмін можуть оплатити будь-який штраф
    IF v_current_user_role = 'Reader' AND v_fine_user_id != p_paid_by_user_id THEN
        RAISE EXCEPTION 'Readers can only pay their own fines';
    END IF;

    -- Оновлюємо штраф
    UPDATE public.fines
    SET ispaid = true,
        paiddate = CURRENT_DATE
    WHERE fineid = p_fine_id;

    -- Логуємо успішну оплату
    RAISE NOTICE 'Fine % paid successfully by user %', p_fine_id, p_paid_by_user_id;
END;
$$;

-- Надаємо права на виконання процедури
GRANT EXECUTE ON PROCEDURE public.pay_fine TO role_reader, role_accountant, role_admin;

-- Коментар до процедури
COMMENT ON PROCEDURE public.pay_fine IS 'Оплата штрафу. Читачі можуть оплачувати лише власні штрафи. Бухгалтери та Адміни можуть оплачувати будь-які штрафи.';
